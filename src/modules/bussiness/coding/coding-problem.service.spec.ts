import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CodingProblemService,
} from "./coding-problem.service"
import {
    CodingProblemEntity,
    CodingVerdict,
    Locale,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
} from "@modules/exceptions"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Minimal stand-in for the Elasticsearch client surface this service uses:
 * `search` for the catalog list + single-problem detail, `get` for the hint.
 */
interface ElasticsearchClientMock {
    /** Programmed per-test: resolves a `{ hits: { hits, total } }` response. */
    search: jest.Mock
    /** Programmed per-test: resolves a `{ _source }` hint doc or rejects 404. */
    get: jest.Mock
}

describe("CodingProblemService",
    () => {
        let module: TestingModule
        let service: CodingProblemService
        let entityManager: EntityManagerMock
        let elasticsearchClient: ElasticsearchClientMock
        let elasticsearchService: jest.Mocked<
            Pick<ElasticsearchService, "indicateName">
        >

        const userId = "user-1"
        const slug = "two-sum"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // ES client stub: search (catalog list + detail) + get (hint)
            elasticsearchClient = {
                search: jest.fn(),
                get: jest.fn(),
            }
            elasticsearchService = {
                indicateName: jest.fn(() => "coding-problems-en"),
                client: elasticsearchClient,
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">>

            module = await Test.createTestingModule({
                providers: [
                    CodingProblemService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchService,
                    },
                ],
            }).compile()

            service = module.get<CodingProblemService>(CodingProblemService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("list",
            () => {
                /** Program the ES `search` to return the given hits + total. */
                const programSearch = (
                    sources: Array<Partial<CodingProblemEntity>>,
                    total: number,
                ): void => {
                    elasticsearchClient.search.mockResolvedValueOnce({
                        hits: {
                            hits: sources.map((source) => ({
                                _source: source,
                            })),
                            total: {
                                value: total,
                            },
                        },
                    })
                }

                it("returns the page + total from the ES catalog index",
                    async () => {
                        programSearch([
                            {
                                id: "p1",
                                slug,
                            },
                        ],
                        1)

                        const result = await service.list({
                        })

                        expect(result.problems).toHaveLength(1)
                        expect(result.problems[0].id).toBe("p1")
                        expect(result.total).toBe(1)
                        // catalog read hits the per-locale index, never Postgres
                        expect(elasticsearchService.indicateName).toHaveBeenCalledWith({
                            entity: CodingProblemEntity.name,
                            locale: Locale.En,
                        })
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("filters by enabled + optional difficulty + tag",
                    async () => {
                        programSearch([],
                            0)

                        await service.list({
                            difficulty: "easy" as never,
                            tag: "array",
                        })

                        const body = elasticsearchClient.search.mock.calls[0][0]
                        const filter = body.query.bool.filter as Array<Record<string, unknown>>
                        // always enabled, plus the two optional facets
                        expect(filter).toContainEqual({
                            term: {
                                enabled: true,
                            },
                        })
                        expect(filter).toContainEqual({
                            term: {
                                difficulty: "easy",
                            },
                        })
                        expect(filter).toContainEqual({
                            term: {
                                tags: "array",
                            },
                        })
                    })

                it("paginates with the right from/size",
                    async () => {
                        programSearch([],
                            0)

                        await service.list({
                            page: 3,
                            limit: 10,
                        })

                        const body = elasticsearchClient.search.mock.calls[0][0]
                        // page 3 of size 10 → from 20, size 10
                        expect(body.from).toBe(20)
                        expect(body.size).toBe(10)
                    })
            })

        describe("getBySlug",
            () => {
                it("returns the pre-localized ES document for an enabled problem",
                    async () => {
                        const hit = {
                            id: "p1",
                            slug,
                        } as unknown as CodingProblemEntity
                        elasticsearchClient.search.mockResolvedValueOnce({
                            hits: {
                                hits: [
                                    {
                                        _source: hit,
                                    },
                                ],
                            },
                        })

                        const result = await service.getBySlug({
                            slug,
                        })

                        expect(result).toBe(hit)
                        // detail view reads the per-locale index
                        expect(elasticsearchService.indicateName).toHaveBeenCalledWith({
                            entity: CodingProblemEntity.name,
                            locale: Locale.En,
                        })
                    })

                it("never returns reference solutions in the detail payload",
                    async () => {
                        // a stale doc indexed before the sync-builder fix still carries
                        // reference solutions — the detail read must strip them so the
                        // answer only ever flows through the reveal mutation
                        const hit = {
                            id: "p1",
                            slug,
                            starterCodes: [
                                {
                                    language: "typescript",
                                    code: "// boilerplate",
                                },
                            ],
                            solutions: [
                                {
                                    language: "typescript",
                                    code: "// the worked answer",
                                },
                            ],
                        } as unknown as CodingProblemEntity
                        elasticsearchClient.search.mockResolvedValueOnce({
                            hits: {
                                hits: [
                                    {
                                        _source: hit,
                                    },
                                ],
                            },
                        })

                        const result = await service.getBySlug({
                            slug,
                        })

                        // solutions are gone; starter codes (boilerplate) are retained
                        expect(result.solutions).toBeUndefined()
                        expect(result).not.toHaveProperty("solutions")
                        expect(result.starterCodes).toHaveLength(1)
                    })

                it("throws CodingProblemNotFoundException when no hit comes back",
                    async () => {
                        // empty hits → missing or disabled problem
                        elasticsearchClient.search.mockResolvedValueOnce({
                            hits: {
                                hits: [],
                            },
                        })

                        await expect(
                            service.getBySlug({
                                slug,
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)
                    })
            })

        describe("getHint",
            () => {
                it("returns the hint for the requested locale on the first try",
                    async () => {
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: {
                                slug,
                                hint: "use a hash map",
                            },
                        })

                        const result = await service.getHint({
                            slug,
                            locale: Locale.En,
                        })

                        expect(result).toEqual({
                            slug,
                            hint: "use a hash map",
                        })
                        // English-only path makes exactly one lookup (no fallback)
                        expect(elasticsearchClient.get).toHaveBeenCalledTimes(1)
                    })

                it("falls back to English when the requested locale has no hint",
                    async () => {
                        elasticsearchClient.get
                            // first try (vi) misses → rejected 404
                            .mockRejectedValueOnce(new Error("404"))
                            // English fallback resolves the hint
                            .mockResolvedValueOnce({
                                _source: {
                                    slug,
                                    hint: "english hint",
                                },
                            })

                        const result = await service.getHint({
                            slug,
                            locale: Locale.Vi,
                        })

                        expect(result?.hint).toBe("english hint")
                        // tried the requested locale, then English
                        expect(elasticsearchClient.get).toHaveBeenCalledTimes(2)
                    })

                it("returns null when no hint exists in any candidate locale",
                    async () => {
                        // every locale lookup rejects (missing doc/index)
                        elasticsearchClient.get.mockRejectedValue(new Error("404"))

                        const result = await service.getHint({
                            slug,
                            locale: Locale.Vi,
                        })

                        expect(result).toBeNull()
                    })

                it("treats a document with an empty hint body as no hint",
                    async () => {
                        // a doc with no `hint` field is not a usable hint
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: {
                                slug,
                            },
                        })

                        const result = await service.getHint({
                            slug,
                            locale: Locale.En,
                        })

                        expect(result).toBeNull()
                    })
            })

        describe("leaderboard",
            () => {
                it("normalises raw rows and parses the string solved count",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                userId: "u1",
                                username: "alice",
                                solvedCount: "7",
                            },
                            {
                                userId: "u2",
                                // null username falls back to an empty string
                                username: null,
                                solvedCount: "3",
                            },
                        ])

                        const result = await service.leaderboard({
                        })

                        expect(result).toEqual([
                            {
                                userId: "u1",
                                username: "alice",
                                solvedCount: 7,
                            },
                            {
                                userId: "u2",
                                username: "",
                                solvedCount: 3,
                            },
                        ])
                        // the raw query is parameterised by the Accepted verdict + limit
                        expect(entityManager.query).toHaveBeenCalledWith(
                            expect.any(String),
                            [
                                CodingVerdict.Accepted,
                                50,
                            ],
                        )
                    })

                it("honours an explicit limit",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        await service.leaderboard({
                            limit: 5,
                        })

                        expect(entityManager.query).toHaveBeenCalledWith(
                            expect.any(String),
                            [
                                CodingVerdict.Accepted,
                                5,
                            ],
                        )
                    })
            })
    })
