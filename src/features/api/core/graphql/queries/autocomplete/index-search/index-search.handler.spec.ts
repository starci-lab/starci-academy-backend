// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    IndexSearchHandler,
} from "./index-search.handler"
import {
    IndexSearchQuery,
} from "./index-search.query"
import {
    IndexSearchType,
} from "./graphql-types/request"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ParentIndexCacheResult,
} from "@modules/integrations/cache/types/cache-results/parent-index"

/** Build an ES search response from raw hits. */
const buildSearchResponse = (
    hits: Array<unknown>,
): unknown => ({
    hits: {
        hits,
    },
})

describe("IndexSearchHandler",
    () => {
        let module: TestingModule
        let handler: IndexSearchHandler
        let search: jest.Mock
        let cacheGet: jest.Mock

        beforeEach(async () => {
            search = jest.fn()
            cacheGet = jest.fn().mockResolvedValue(undefined)

            module = await Test.createTestingModule({
                providers: [
                    IndexSearchHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: {
                            client: {
                                search,
                            },
                        },
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: cacheGet,
                        },
                    },
                ],
            }).compile()

            handler = module.get<IndexSearchHandler>(IndexSearchHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("short-circuits to an empty result for a blank keyword without hitting ES",
            async () => {
                const result = await handler.execute(
                    new IndexSearchQuery({
                        request: {
                            type: IndexSearchType.ContentIndex,
                            query: "   ",
                        },
                        locale: Locale.En,
                    }),
                )

                expect(result).toEqual({
                    items: [],
                })
                expect(search).not.toHaveBeenCalled()
            })

        it("maps hits to items, using highlight fragments as texts and the parent path",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        {
                            _id: "ignored",
                            _source: {
                                id: "ct-1",
                                displayId: "react",
                                title: "React",
                            },
                            highlight: {
                                title: ["<em>Rea</em>ct"],
                                description: ["a <em>rea</em>ctive lib"],
                            },
                        },
                    ]),
                )
                cacheGet.mockResolvedValueOnce({
                    content: {
                        displayId: "react",
                    },
                    module: {
                        displayId: "frontend",
                    },
                    course: {
                        displayId: "fullstack",
                    },
                } as ParentIndexCacheResult)

                const result = await handler.execute(
                    new IndexSearchQuery({
                        request: {
                            type: IndexSearchType.ContentIndex,
                            query: "rea",
                        },
                        locale: Locale.En,
                    }),
                )

                const item = result.items[0]
                expect(item.id).toBe("ct-1")
                expect(item.displayId).toBe("react")
                expect(item.title).toBe("React")
                // highlight fragments from title + description are concatenated
                expect(item.texts).toEqual([
                    "<em>Rea</em>ct",
                    "a <em>rea</em>ctive lib",
                ])
                // a ContentParentIndexCacheResult only carries content/module/course
                expect(item.parentPath).toEqual({
                    courseDisplayId: "fullstack",
                    moduleDisplayId: "frontend",
                    contentDisplayId: "react",
                    challengeDisplayId: undefined,
                })
            })

        it("falls back to the title for texts when there are no highlight fragments",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse([
                        {
                            _id: "hit-id",
                            _source: {
                                // no id field -> handler falls back to _id
                                displayId: "kafka",
                                title: "Kafka",
                            },
                        },
                    ]),
                )

                const result = await handler.execute(
                    new IndexSearchQuery({
                        request: {
                            type: IndexSearchType.ChallengeIndex,
                            query: "kaf",
                        },
                        locale: Locale.En,
                    }),
                )

                const item = result.items[0]
                // source.id missing -> uses the hit _id
                expect(item.id).toBe("hit-id")
                // no highlights -> texts defaults to [title]
                expect(item.texts).toEqual(["Kafka"])
                // no cached parent ref -> parentPath omitted
                expect(item.parentPath).toBeUndefined()
            })

        it("passes the request size straight through to the ES search call",
            async () => {
                search.mockResolvedValueOnce(buildSearchResponse([]))

                await handler.execute(
                    new IndexSearchQuery({
                        request: {
                            type: IndexSearchType.CourseIndex,
                            query: "sys",
                            size: 3,
                        },
                        locale: Locale.En,
                    }),
                )

                expect(search).toHaveBeenCalledWith(
                    expect.objectContaining({
                        index: "courses",
                        size: 3,
                    }),
                )
            })
    })
