// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see course.handler.spec.ts for the full rationale).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    CoursesHandler,
} from "./courses.handler"
import {
    CoursesQuery,
} from "./courses.query"
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
    SortBy,
} from "./graphql-types"

/**
 * Build an ES search response whose hits carry the given `_source` rows and the
 * given total count, mirroring the `@elastic/elasticsearch` shape the handler reads.
 */
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

describe("CoursesHandler",
    () => {
        let module: TestingModule
        let handler: CoursesHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }

        beforeEach(async () => {
            // ES stub: indicateName echoes a deterministic index, client.search is programmed per test
            elasticsearch = {
                indicateName: jest.fn(() => "courses-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    CoursesHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<CoursesHandler>(CoursesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits to data and reads the numeric total as count",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "c1",
                            },
                            {
                                id: "c2",
                            },
                        ],
                        2,
                    ),
                )

                const result = await handler.execute(
                    new CoursesQuery({
                        request: {
                            filters: {
                                sorts: [
                                    {
                                        by: SortBy.Title,
                                        order: SortOrder.Asc,
                                    },
                                ],
                                limit: 10,
                                pageNumber: 0,
                            },
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.count).toBe(2)
                expect(result.data.map((course) => course.id)).toEqual([
                    "c1",
                    "c2",
                ])
            })

        it("normalizes the object-form total and computes the from/size window",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "c9",
                            },
                        ],
                        {
                            value: 57,
                        },
                    ),
                )

                const result = await handler.execute(
                    new CoursesQuery({
                        request: {
                            filters: {
                                sorts: [
                                    {
                                        by: SortBy.CreatedAt,
                                        order: SortOrder.Desc,
                                    },
                                ],
                                limit: 5,
                                pageNumber: 3,
                            },
                        },
                        locale: Locale.En,
                    }),
                )

                // object-form total → use its .value
                expect(result.count).toBe(57)
                // page 3 with size 5 → offset 15, and the sort order is lower-cased for ES
                const searchArgs = elasticsearch.client.search.mock.calls[0][0]
                expect(searchArgs.from).toBe(15)
                expect(searchArgs.size).toBe(5)
                expect(searchArgs.sort).toEqual([
                    {
                        createdAt: {
                            order: "desc",
                        },
                    },
                ])
            })

        it("falls back to count 0 when ES omits the total",
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
                    new CoursesQuery({
                        request: {
                            filters: {
                                sorts: [],
                                limit: 10,
                                pageNumber: 0,
                            },
                        },
                    }),
                )

                expect(result.count).toBe(0)
                expect(result.data).toEqual([])
            })
    })
