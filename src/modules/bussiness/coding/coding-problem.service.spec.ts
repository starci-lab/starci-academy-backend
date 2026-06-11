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
} from "@tests/utils"
import type {
    EntityManagerMock,
} from "@tests/utils"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * A chainable stand-in for the `list()` query builder. Every filter/paginate
 * method returns the same builder; `getManyAndCount` is the terminal the test
 * programs with a `[rows, total]` tuple.
 */
interface ListQueryBuilderMock {
    /** Chainable: records the eager translations join. */
    leftJoinAndSelect: jest.Mock
    /** Chainable: records the root enabled-only WHERE. */
    where: jest.Mock
    /** Chainable: records an optional difficulty/tag AND clause. */
    andWhere: jest.Mock
    /** Chainable: records the orderIndex ordering. */
    orderBy: jest.Mock
    /** Chainable: records the page offset. */
    skip: jest.Mock
    /** Chainable: records the page size. */
    take: jest.Mock
    /** Terminal: resolves the `[problems, total]` tuple. */
    getManyAndCount: jest.Mock
}

/**
 * Minimal stand-in for the Elasticsearch client surface this service uses:
 * `search` for the single-problem detail, `get` for the per-locale hint.
 */
interface ElasticsearchClientMock {
    /** Programmed per-test: resolves a `{ hits: { hits } }` response. */
    search: jest.Mock
    /** Programmed per-test: resolves a `{ _source }` hint doc or rejects 404. */
    get: jest.Mock
}

/** Build a fresh chainable list query-builder mock. */
const makeListQueryBuilderMock = (): ListQueryBuilderMock => {
    // declare first so each chainable method can return the same instance
    const builder = {
    } as ListQueryBuilderMock
    builder.leftJoinAndSelect = jest.fn(() => builder)
    builder.where = jest.fn(() => builder)
    builder.andWhere = jest.fn(() => builder)
    builder.orderBy = jest.fn(() => builder)
    builder.skip = jest.fn(() => builder)
    builder.take = jest.fn(() => builder)
    // terminal resolves "no rows" until a test programs it
    builder.getManyAndCount = jest.fn().mockResolvedValue([
        [],
        0,
    ])
    return builder
}

describe("CodingProblemService",
    () => {
        let module: TestingModule
        let service: CodingProblemService
        let entityManager: EntityManagerMock
        let listQueryBuilder: ListQueryBuilderMock
        let elasticsearchClient: ElasticsearchClientMock
        let elasticsearchService: jest.Mocked<
            Pick<ElasticsearchService, "indicateName">
        >

        const userId = "user-1"
        const slug = "two-sum"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // override createQueryBuilder with a builder that supports skip/take/getManyAndCount
            listQueryBuilder = makeListQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => listQueryBuilder)

            // ES client stub: search (detail) + get (hint)
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
                it("returns the page + total and skips solved ids for an anonymous viewer",
                    async () => {
                        const problems = [
                            {
                                id: "p1",
                                translations: [],
                            },
                        ] as unknown as Array<CodingProblemEntity>
                        listQueryBuilder.getManyAndCount.mockResolvedValueOnce([
                            problems,
                            1,
                        ])

                        const result = await service.list({
                        })

                        expect(result.problems).toBe(problems)
                        expect(result.total).toBe(1)
                        // no userId → solved-set query never runs
                        expect(result.solvedProblemIds).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("applies the difficulty + tag filters when provided",
                    async () => {
                        await service.list({
                            difficulty: "easy" as never,
                            tag: "array",
                        })

                        // both optional filters add an AND clause
                        expect(listQueryBuilder.andWhere).toHaveBeenCalledTimes(2)
                    })

                it("paginates with the right offset/limit",
                    async () => {
                        await service.list({
                            page: 3,
                            limit: 10,
                        })

                        // page 3 of size 10 → skip 20, take 10
                        expect(listQueryBuilder.skip).toHaveBeenCalledWith(20)
                        expect(listQueryBuilder.take).toHaveBeenCalledWith(10)
                    })

                it("computes solved problem ids for an authenticated viewer",
                    async () => {
                        listQueryBuilder.getManyAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])
                        // raw solved-ids query returns one distinct Accepted problem id
                        entityManager.query.mockResolvedValueOnce([
                            {
                                codingProblemId: "p1",
                            },
                        ])

                        const result = await service.list({
                            userId,
                        })

                        expect(result.solvedProblemIds).toEqual([
                            "p1",
                        ])
                        // the raw query is parameterised by userId + the Accepted verdict
                        expect(entityManager.query).toHaveBeenCalledWith(
                            expect.any(String),
                            [
                                userId,
                                CodingVerdict.Accepted,
                            ],
                        )
                    })

                it("overrides title/statement from translations for a non-English locale",
                    async () => {
                        const problem = {
                            id: "p1",
                            title: "English title",
                            statement: "English statement",
                            translations: [
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Tiêu đề",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "statement",
                                    value: "Nội dung",
                                },
                            ],
                        } as unknown as CodingProblemEntity
                        listQueryBuilder.getManyAndCount.mockResolvedValueOnce([
                            [
                                problem,
                            ],
                            1,
                        ])

                        const result = await service.list({
                            locale: Locale.Vi,
                        })

                        // the localized rows replace the default English columns in place
                        expect(result.problems[0].title).toBe("Tiêu đề")
                        expect(result.problems[0].statement).toBe("Nội dung")
                    })

                it("leaves English titles untouched (no translation override)",
                    async () => {
                        const problem = {
                            id: "p1",
                            title: "English title",
                            statement: "English statement",
                            translations: [
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Tiêu đề",
                                },
                            ],
                        } as unknown as CodingProblemEntity
                        listQueryBuilder.getManyAndCount.mockResolvedValueOnce([
                            [
                                problem,
                            ],
                            1,
                        ])

                        const result = await service.list({
                            locale: Locale.En,
                        })

                        // English uses the default columns — nothing is overridden
                        expect(result.problems[0].title).toBe("English title")
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
