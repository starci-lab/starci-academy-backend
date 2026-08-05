// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ContentsHandler,
} from "./contents.handler"
import {
    ContentsQuery,
} from "./contents.query"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    SortOrder,
} from "@modules/api"
import {
    Locale,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    ContentEntity,
    UserEntity,
} from "@modules/databases"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Build an ES content source with a body long enough to exercise truncation. */
const buildSource = (
    overrides: Partial<ContentEntity> = {
    },
): Partial<ContentEntity> => ({
    id: "c1",
    isPremium: false,
    body: `intro ${"x".repeat(2000)} tail`,
    bodies: [],
    codeExplainings: [
        {
            id: "ce-1",
        },
    ],
    codeImplementations: [
        {
            id: "ci-1",
        },
    ],
    ...overrides,
}) as Partial<ContentEntity>

/** Build an ES search response hit envelope from a list of source documents. */
const buildSearchResponse = (
    sources: Array<Partial<ContentEntity>>,
): unknown => ({
    hits: {
        total: sources.length,
        hits: sources.map((source) => ({
            _source: source,
        })),
    },
})

describe("ContentsHandler",
    () => {
        let module: TestingModule
        let handler: ContentsHandler
        let entityManager: EntityManagerMock
        let search: jest.Mock
        let indicateName: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            search = jest.fn()
            indicateName = jest.fn(() => "contents-en")

            module = await Test.createTestingModule({
                providers: [
                    ContentsHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: {
                            client: {
                                search,
                            },
                            indicateName,
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ContentsHandler>(ContentsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns hits with paging math and unlocks free items for an anonymous viewer",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        buildSource({
                            id: "c1",
                            isPremium: false,
                        }),
                    ]),
                )

                const result = await handler.execute(
                    new ContentsQuery({
                        request: {
                            moduleId: "m1",
                            filters: {
                                limit: 5,
                                pageNumber: 2,
                                sorts: [
                                    {
                                        by: "createdAt",
                                        order: SortOrder.Asc,
                                    },
                                ],
                            },
                        },
                        locale: Locale.En,
                    }),
                )

                expect(result.count).toBe(1)
                expect(result.data[0].isPremium).toBe(false)
                // from = pageNumber * limit = 10; size = limit = 5; sort lowercased
                expect(search).toHaveBeenCalledWith(
                    expect.objectContaining({
                        index: "contents-en",
                        from: 10,
                        size: 5,
                        sort: [
                            {
                                createdAt: {
                                    order: "asc",
                                },
                            },
                        ],
                    }),
                )
                // anonymous viewer -> no entitlement DB lookup at all
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("locks premium items for a viewer who is not enrolled",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        buildSource({
                            id: "c1",
                            isPremium: true,
                        }),
                    ]),
                )
                entityManager.findOne
                    // module row -> owning course (loaded via the `course` relation,
                    // not the virtual @RelationId `courseId` column)
                    .mockResolvedValueOnce({
                        id: "m1",
                        course: {
                            id: "course-1",
                        },
                    })
                    // no enrollment for this viewer
                    .mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ContentsQuery({
                        request: {
                            moduleId: "m1",
                            filters: {
                                limit: 10,
                                pageNumber: 0,
                                sorts: [],
                            },
                        },
                        locale: Locale.En,
                        user: fakeUser("u1"),
                    }),
                )

                const item = result.data[0]
                // locked-for-you flag stays true and the body is truncated + ellipsised
                expect(item.isPremium).toBe(true)
                expect(item.body?.endsWith("...")).toBe(true)
                expect(item.body).not.toContain("tail")
                // premium-only code assets are stripped
                expect(item.codeExplainings).toEqual([])
                expect(item.codeImplementations).toEqual([])
            })

        it("unlocks premium items for an enrolled viewer",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        buildSource({
                            id: "c1",
                            isPremium: true,
                        }),
                    ]),
                )
                entityManager.findOne
                    // module row -> owning course (loaded via the `course` relation,
                    // not the virtual @RelationId `courseId` column)
                    .mockResolvedValueOnce({
                        id: "m1",
                        course: {
                            id: "course-1",
                        },
                    })
                    // an active enrollment grants full access
                    .mockResolvedValueOnce({
                        id: "enroll-1",
                    })

                const result = await handler.execute(
                    new ContentsQuery({
                        request: {
                            moduleId: "m1",
                            filters: {
                                limit: 10,
                                pageNumber: 0,
                                sorts: [],
                            },
                        },
                        locale: Locale.En,
                        user: fakeUser("u1"),
                    }),
                )

                const item = result.data[0]
                // entitled -> unlocked and full body / assets preserved
                expect(item.isPremium).toBe(false)
                expect(item.body).toContain("tail")
                expect(item.codeImplementations).toHaveLength(1)
            })

        it("denies premium access when the module cannot be resolved",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        buildSource({
                            id: "c1",
                            isPremium: true,
                        }),
                    ]),
                )
                // module row is missing -> conservative deny, no enrollment lookup
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ContentsQuery({
                        request: {
                            moduleId: "m1",
                            filters: {
                                limit: 10,
                                pageNumber: 0,
                                sorts: [],
                            },
                        },
                        locale: Locale.En,
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.data[0].isPremium).toBe(true)
                // only the module lookup ran; the enrollment query was skipped
                expect(entityManager.findOne).toHaveBeenCalledTimes(1)
            })
    })
