// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    FoundationsHandler,
} from "./foundations.handler"
import {
    FoundationsQuery,
} from "./foundations.query"
import {
    FoundationsSortBy,
} from "./graphql-types"
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
    EsSourceRow,
    EsTotalValue,
    MockedElasticsearchService,
} from "./types"

/** Build an ES search response with hit rows + a total count. */
const buildSearchResponse = (
    rows: Array<EsSourceRow>,
    total: number | EsTotalValue,
): unknown => ({
    hits: {
        total,
        hits: rows.map((row) => ({
            _source: row,
        })),
    },
})

describe("FoundationsHandler",
    () => {
        let module: TestingModule
        let handler: FoundationsHandler
        let elasticsearch: MockedElasticsearchService

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "foundations-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as MockedElasticsearchService

            module = await Test.createTestingModule({
                providers: [
                    FoundationsHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<FoundationsHandler>(FoundationsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits, reads the total and scopes to the category",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "f1",
                            },
                        ],
                        {
                            value: 12,
                        },
                    ),
                )

                const result = await handler.execute(
                    new FoundationsQuery({
                        request: {
                            categoryId: "cat-1",
                            filters: {
                                sorts: [
                                    {
                                        by: FoundationsSortBy.SortIndex,
                                        order: SortOrder.Asc,
                                    },
                                ],
                                limit: 5,
                                pageNumber: 1,
                            },
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.count).toBe(12)
                expect(result.data.map((foundation) => foundation.id)).toEqual([
                    "f1",
                ])
                // page 1 with size 5 → offset 5
                const searchArgs = elasticsearch.client.search.mock.calls[0][0]
                expect(searchArgs.from).toBe(5)
                expect(searchArgs.size).toBe(5)
                // category id flows into the term filter
                expect(JSON.stringify(searchArgs.query)).toContain("cat-1")
            })

        it("applies a default OrderIndex/Asc sort when filters are omitted",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [],
                        0,
                    ),
                )

                const result = await handler.execute(
                    new FoundationsQuery({
                        request: {
                            categoryId: "cat-1",
                        },
                    }),
                )

                // numeric total read directly
                expect(result.count).toBe(0)
                // default sort kicks in: orderIndex asc
                expect(elasticsearch.client.search.mock.calls[0][0].sort).toEqual([
                    {
                        sortIndex: {
                            order: "asc",
                        },
                    },
                ])
            })
    })
