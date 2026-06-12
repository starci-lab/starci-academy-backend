// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    HeadhuntingCompanyHandler,
} from "./headhunting-company.handler"
import {
    HeadhunterCompanyQuery,
} from "./headhunting-company.query"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    HeadhuntingCompanyNotFoundException,
} from "@modules/exceptions"
import {
    Locale,
} from "@modules/databases"

describe("HeadhuntingCompanyHandler",
    () => {
        let module: TestingModule
        let handler: HeadhuntingCompanyHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { get: jest.Mock; search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "headhunting-companies-vi"),
                client: {
                    get: jest.fn(),
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { get: jest.Mock; search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    HeadhuntingCompanyHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<HeadhuntingCompanyHandler>(HeadhuntingCompanyHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when neither id nor displayId is supplied",
            async () => {
                await expect(
                    handler.execute(
                        new HeadhunterCompanyQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(HeadhuntingCompanyNotFoundException)
            })

        it("fetches by id via a direct ES get",
            async () => {
                elasticsearch.client.get.mockResolvedValueOnce({
                    _source: {
                        id: "co-1",
                    },
                })

                const result = await handler.execute(
                    new HeadhunterCompanyQuery({
                        request: {
                            id: "co-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.id).toBe("co-1")
            })

        it("returns the first hit when fetched by displayId",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    hits: {
                        hits: [
                            {
                                _source: {
                                    id: "co-9",
                                    displayId: "acme",
                                },
                            },
                        ],
                    },
                })

                const result = await handler.execute(
                    new HeadhunterCompanyQuery({
                        request: {
                            displayId: "acme",
                        },
                    }),
                )

                expect(result.id).toBe("co-9")
                expect(elasticsearch.client.get).not.toHaveBeenCalled()
            })

        it("throws when the displayId term search is empty",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    hits: {
                        hits: [],
                    },
                })

                await expect(
                    handler.execute(
                        new HeadhunterCompanyQuery({
                            request: {
                                displayId: "unknown",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(HeadhuntingCompanyNotFoundException)
            })
    })
