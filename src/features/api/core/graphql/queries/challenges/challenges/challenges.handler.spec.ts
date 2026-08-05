// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ChallengesHandler,
} from "./challenges.handler"
import {
    ChallengesQuery,
} from "./challenges.query"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    SortOrder,
} from "@modules/api"
import {
    Locale,
} from "@modules/databases"
import type {
    ChallengeEntity,
} from "@modules/databases"

/** Build an ES search response hit envelope from a list of source documents. */
const buildSearchResponse = (
    sources: Array<Partial<ChallengeEntity>>,
    total: number | {
        value: number
    } = sources.length,
): unknown => ({
    hits: {
        total,
        hits: sources.map((source) => ({
            _source: source,
        })),
    },
})

describe("ChallengesHandler",
    () => {
        let module: TestingModule
        let handler: ChallengesHandler
        let search: jest.Mock
        let indicateName: jest.Mock

        beforeEach(async () => {
            search = jest.fn()
            indicateName = jest.fn(() => "challenges-en")

            module = await Test.createTestingModule({
                providers: [
                    ChallengesHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: {
                            client: {
                                search,
                            },
                            indicateName,
                        },
                    },
                ],
            }).compile()

            handler = module.get<ChallengesHandler>(ChallengesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits to sources and reads the numeric total as the count",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "ch-1",
                            },
                            {
                                id: "ch-2",
                            },
                        ],
                        7,
                    ),
                )

                const result = await handler.execute(
                    new ChallengesQuery({
                        request: {
                            contentId: "content-1",
                            filters: {
                                limit: 5,
                                pageNumber: 2,
                                sorts: [
                                    {
                                        by: "createdAt",
                                        order: SortOrder.Desc,
                                    },
                                ],
                            },
                        },
                        locale: Locale.En,
                    }),
                )

                expect(result.count).toBe(7)
                expect(result.data.map((d) => d.id)).toEqual([
                    "ch-1",
                    "ch-2",
                ])
                // from = pageNumber * limit = 2 * 5 = 10; size = limit = 5; sort lowercased
                expect(search).toHaveBeenCalledWith(
                    expect.objectContaining({
                        index: "challenges-en",
                        from: 10,
                        size: 5,
                        sort: [
                            {
                                createdAt: {
                                    order: "desc",
                                },
                            },
                        ],
                    }),
                )
            })

        it("reads the count from the total object value form",
            async () => {
                search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [],
                        {
                            value: 42,
                        },
                    ),
                )

                const result = await handler.execute(
                    new ChallengesQuery({
                        request: {
                            contentId: "content-1",
                            filters: {
                                limit: 10,
                                pageNumber: 0,
                                sorts: [],
                            },
                        },
                        locale: Locale.En,
                    }),
                )

                expect(result.count).toBe(42)
                expect(result.data).toEqual([])
            })
    })
