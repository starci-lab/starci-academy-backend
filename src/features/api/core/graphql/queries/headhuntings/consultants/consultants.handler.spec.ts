// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ConsultantsHandler,
} from "./consultants.handler"
import {
    ConsultantsQuery,
} from "./consultants.query"
import {
    ConsultantsSortBy,
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

/** Build an ES search response with hit rows + a total count. */
const buildSearchResponse = (
    rows: Array<{ id: string }>,
    total: number | { value: number },
): unknown => ({
    hits: {
        total,
        hits: rows.map((row) => ({
            _source: row,
        })),
    },
})

describe("ConsultantsHandler",
    () => {
        let module: TestingModule
        let handler: ConsultantsHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "consultants-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    ConsultantsHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<ConsultantsHandler>(ConsultantsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits, reads the total and scopes to the company",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "con-1",
                            },
                        ],
                        7,
                    ),
                )

                const result = await handler.execute(
                    new ConsultantsQuery({
                        request: {
                            companyId: "co-1",
                            filters: {
                                sorts: [
                                    {
                                        by: ConsultantsSortBy.FullName,
                                        order: SortOrder.Asc,
                                    },
                                ],
                                limit: 5,
                                pageNumber: 0,
                            },
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.count).toBe(7)
                expect(result.data.map((consultant) => consultant.id)).toEqual([
                    "con-1",
                ])
                // company id scopes the term filter
                expect(JSON.stringify(elasticsearch.client.search.mock.calls[0][0].query))
                    .toContain("co-1")
            })

        it("applies a default OrderIndex/Asc sort when filters are omitted",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [],
                        {
                            value: 0,
                        },
                    ),
                )

                const result = await handler.execute(
                    new ConsultantsQuery({
                        request: {
                            companyId: "co-1",
                        },
                    }),
                )

                expect(result.count).toBe(0)
                expect(elasticsearch.client.search.mock.calls[0][0].sort).toEqual([
                    {
                        sortIndex: {
                            order: "asc",
                        },
                    },
                ])
            })
    })
