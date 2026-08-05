// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    FoundationHandler,
} from "./foundation.handler"
import {
    FoundationQuery,
} from "./foundation.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    FoundationNotFoundException,
} from "@modules/platform/exceptions/errors/courses/foundation-not-found"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

describe("FoundationHandler",
    () => {
        let module: TestingModule
        let handler: FoundationHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { get: jest.Mock; search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "foundations-vi"),
                client: {
                    get: jest.fn(),
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { get: jest.Mock; search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    FoundationHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<FoundationHandler>(FoundationHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when neither id nor displayId is supplied",
            async () => {
                await expect(
                    handler.execute(
                        new FoundationQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(FoundationNotFoundException)

                expect(elasticsearch.client.get).not.toHaveBeenCalled()
            })

        it("fetches by id via a direct ES get",
            async () => {
                elasticsearch.client.get.mockResolvedValueOnce({
                    _source: {
                        id: "f1",
                    },
                })

                const result = await handler.execute(
                    new FoundationQuery({
                        request: {
                            id: "f1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.id).toBe("f1")
                expect(elasticsearch.client.get).toHaveBeenCalledWith({
                    index: "foundations-vi",
                    id: "f1",
                })
            })

        it("maps an ES get failure to a not-found error (by id)",
            async () => {
                // a thrown ES error (e.g. 404) is normalized to the domain exception
                elasticsearch.client.get.mockRejectedValueOnce(
                    new Error("index_not_found"),
                )

                await expect(
                    handler.execute(
                        new FoundationQuery({
                            request: {
                                id: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(FoundationNotFoundException)
            })

        it("fetches by displayId via a term search and returns the first hit",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    hits: {
                        hits: [
                            {
                                _source: {
                                    id: "f9",
                                    displayId: "docker",
                                },
                            },
                        ],
                    },
                })

                const result = await handler.execute(
                    new FoundationQuery({
                        request: {
                            displayId: "docker",
                        },
                    }),
                )

                expect(result.id).toBe("f9")
                // the id branch is not used when only displayId is given
                expect(elasticsearch.client.get).not.toHaveBeenCalled()
            })

        it("throws when the displayId term search returns no hits",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    hits: {
                        hits: [],
                    },
                })

                await expect(
                    handler.execute(
                        new FoundationQuery({
                            request: {
                                displayId: "unknown",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(FoundationNotFoundException)
            })
    })
