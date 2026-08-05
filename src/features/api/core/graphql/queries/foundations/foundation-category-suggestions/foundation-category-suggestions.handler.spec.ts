// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    FoundationCategorySuggestionsHandler,
} from "./foundation-category-suggestions.handler"
import {
    FoundationCategorySuggestionsQuery,
} from "./foundation-category-suggestions.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** The suggester key the handler reads back from the ES suggest response. */
const SUGGESTER = "categories"

/** Build an ES suggest response carrying the given completion options. */
const buildSuggestResponse = (
    options: Array<{ text: string; _id?: string }>,
): unknown => ({
    suggest: {
        [SUGGESTER]: [
            {
                options,
            },
        ],
    },
})

describe("FoundationCategorySuggestionsHandler",
    () => {
        let module: TestingModule
        let handler: FoundationCategorySuggestionsHandler
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
                    FoundationCategorySuggestionsHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<FoundationCategorySuggestionsHandler>(
                FoundationCategorySuggestionsHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("short-circuits to empty when the prefix is blank (no ES call)",
            async () => {
                const result = await handler.execute(
                    new FoundationCategorySuggestionsQuery({
                        request: {
                            query: "   ",
                        },
                    }),
                )

                expect(result.data).toEqual([])
                expect(elasticsearch.client.search).not.toHaveBeenCalled()
            })

        it("maps completion options to { id, label } and clamps the limit",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSuggestResponse([
                        {
                            text: "Docker",
                            _id: "cat-docker",
                        },
                        {
                            text: "DigitalOcean",
                            _id: "cat-do",
                        },
                    ]),
                )

                const result = await handler.execute(
                    new FoundationCategorySuggestionsQuery({
                        request: {
                            query: "do",
                            limit: 9999,
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.data).toEqual([
                    {
                        id: "cat-docker",
                        label: "Docker",
                    },
                    {
                        id: "cat-do",
                        label: "DigitalOcean",
                    },
                ])
                // limit clamped to the 20 ceiling before hitting ES
                const completion = elasticsearch.client.search.mock.calls[0][0]
                    .suggest[SUGGESTER].completion
                expect(completion.size).toBe(20)
            })

        it("returns empty data when ES yields no suggestions",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    suggest: {
                    },
                })

                const result = await handler.execute(
                    new FoundationCategorySuggestionsQuery({
                        request: {
                            query: "zzz",
                        },
                    }),
                )

                expect(result.data).toEqual([])
            })

        it("coerces a missing option _id to an empty string id",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSuggestResponse([
                        {
                            text: "Kubernetes",
                        },
                    ]),
                )

                const result = await handler.execute(
                    new FoundationCategorySuggestionsQuery({
                        request: {
                            query: "ku",
                        },
                    }),
                )

                expect(result.data).toEqual([
                    {
                        id: "",
                        label: "Kubernetes",
                    },
                ])
            })
    })
