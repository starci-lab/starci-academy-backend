// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    FoundationCategoriesHandler,
} from "./foundation-categories.handler"
import {
    FoundationCategoriesQuery,
} from "./foundation-categories.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

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

describe("FoundationCategoriesHandler",
    () => {
        let module: TestingModule
        let handler: FoundationCategoriesHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "foundation-categories-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    FoundationCategoriesHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<FoundationCategoriesHandler>(FoundationCategoriesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("uses a prefix match query when search is provided and maps the total",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [
                            {
                                id: "cat-1",
                            },
                        ],
                        {
                            value: 1,
                        },
                    ),
                )

                const result = await handler.execute(
                    new FoundationCategoriesQuery({
                        request: {
                            search: "  do  ",
                            pageNumber: 2,
                            limit: 5,
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.totalCount).toBe(1)
                const searchArgs = elasticsearch.client.search.mock.calls[0][0]
                // trimmed prefix drives a match_phrase_prefix on title only
                expect(searchArgs.query).toEqual({
                    match_phrase_prefix: {
                        title: "do",
                    },
                })
                // 1-based page 2 with size 5 -> offset 5
                expect(searchArgs.from).toBe(5)
                expect(searchArgs.size).toBe(5)
            })

        it("uses match_all and default pagination when no request is given",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse(
                        [],
                        0,
                    ),
                )

                const result = await handler.execute(
                    new FoundationCategoriesQuery({
                        request: undefined as never,
                    }),
                )

                expect(result.totalCount).toBe(0)
                const searchArgs = elasticsearch.client.search.mock.calls[0][0]
                // empty search -> match_all
                expect(searchArgs.query).toEqual({
                    match_all: {
                    },
                })
                // defaults: page 1, default size 10, offset 0
                expect(searchArgs.from).toBe(0)
                expect(searchArgs.size).toBe(10)
            })

        it("clamps the page size to the [1, 50] window",
            async () => {
                elasticsearch.client.search.mockResolvedValue(
                    buildSearchResponse(
                        [],
                        0,
                    ),
                )

                await handler.execute(
                    new FoundationCategoriesQuery({
                        request: {
                            limit: 9999,
                            pageNumber: -3,
                        },
                    }),
                )

                const highArgs = elasticsearch.client.search.mock.calls[0][0]
                // limit clamped to the 50 ceiling
                expect(highArgs.size).toBe(50)
                // page clamped up to 1 -> offset 0
                expect(highArgs.from).toBe(0)

                await handler.execute(
                    new FoundationCategoriesQuery({
                        request: {
                            limit: 0,
                        },
                    }),
                )

                // limit clamped up to the 1 floor
                expect(elasticsearch.client.search.mock.calls[1][0].size).toBe(1)
            })
    })
