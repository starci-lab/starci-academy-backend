// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ConsultantHandler,
} from "./consultant.handler"
import {
    ConsultantQuery,
} from "./consultant.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    ConsultantNotFoundException,
} from "@modules/platform/exceptions/errors/courses/consultant-not-found"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    ConsultantContactGateService,
} from "@modules/bussiness/headhuntings/consultant-contact-gate.service"

describe("ConsultantHandler",
    () => {
        let module: TestingModule
        let handler: ConsultantHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { get: jest.Mock; search: jest.Mock }
        }
        let consultantContactGateService: jest.Mocked<
            Pick<ConsultantContactGateService, "getBestCvScore" | "gateConsultant">
        >

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "consultants-vi"),
                client: {
                    get: jest.fn(),
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { get: jest.Mock; search: jest.Mock }
            }

            consultantContactGateService = {
                getBestCvScore: jest.fn().mockResolvedValue(0),
                // pass the consultant through untouched -- contact-gating logic
                // is covered by consultant-contact-gate.service.spec.ts
                gateConsultant: jest.fn((consultant: ConsultantEntity) => consultant),
            } as unknown as jest.Mocked<
                Pick<ConsultantContactGateService, "getBestCvScore" | "gateConsultant">
            >

            module = await Test.createTestingModule({
                providers: [
                    ConsultantHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                    {
                        provide: ConsultantContactGateService,
                        useValue: consultantContactGateService,
                    },
                ],
            }).compile()

            handler = module.get<ConsultantHandler>(ConsultantHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when neither id nor displayId is supplied",
            async () => {
                await expect(
                    handler.execute(
                        new ConsultantQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ConsultantNotFoundException)
            })

        it("fetches by id via a direct ES get",
            async () => {
                elasticsearch.client.get.mockResolvedValueOnce({
                    _source: {
                        id: "con-1",
                    },
                })

                const result = await handler.execute(
                    new ConsultantQuery({
                        request: {
                            id: "con-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.id).toBe("con-1")
            })

        it("maps an ES get failure to a not-found error",
            async () => {
                elasticsearch.client.get.mockRejectedValueOnce(
                    new Error("not_found"),
                )

                await expect(
                    handler.execute(
                        new ConsultantQuery({
                            request: {
                                id: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ConsultantNotFoundException)
            })

        it("fetches by displayId and throws when the term search is empty",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce({
                    hits: {
                        hits: [],
                    },
                })

                await expect(
                    handler.execute(
                        new ConsultantQuery({
                            request: {
                                displayId: "unknown",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ConsultantNotFoundException)
            })
    })
