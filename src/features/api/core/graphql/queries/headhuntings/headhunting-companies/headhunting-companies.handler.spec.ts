// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    HeadhuntingCompaniesHandler,
} from "./headhunting-companies.handler"
import {
    HeadhunterCompaniesQuery,
} from "./headhunting-companies.query"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    Locale,
} from "@modules/databases"
import type {
    HeadhuntingCompanyEntity,
} from "@modules/databases"
import {
    ConsultantContactGateService,
} from "@modules/bussiness"

/** Build an ES search response whose hits carry the given `_source` rows. */
const buildSearchResponse = (
    rows: Array<{ id: string }>,
): unknown => ({
    hits: {
        hits: rows.map((row) => ({
            _source: row,
        })),
    },
})

describe("HeadhuntingCompaniesHandler",
    () => {
        let module: TestingModule
        let handler: HeadhuntingCompaniesHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }
        let consultantContactGateService: jest.Mocked<
            Pick<ConsultantContactGateService, "getBestCvScore" | "gateConsultants">
        >

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "headhunting-companies-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            consultantContactGateService = {
                getBestCvScore: jest.fn().mockResolvedValue(0),
                // pass the consultants through untouched — contact-gating logic
                // is covered by consultant-contact-gate.service.spec.ts
                gateConsultants: jest.fn((consultants: HeadhuntingCompanyEntity["consultants"]) => consultants),
            } as unknown as jest.Mocked<
                Pick<ConsultantContactGateService, "getBestCvScore" | "gateConsultants">
            >

            module = await Test.createTestingModule({
                providers: [
                    HeadhuntingCompaniesHandler,
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

            handler = module.get<HeadhuntingCompaniesHandler>(HeadhuntingCompaniesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns the mapped hit list ordered by the locale index",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([
                        {
                            id: "co-1",
                        },
                        {
                            id: "co-2",
                        },
                    ]),
                )

                const result = await handler.execute(
                    new HeadhunterCompaniesQuery({
                        request: {
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.map((company) => company.id)).toEqual([
                    "co-1",
                    "co-2",
                ])
                // ordered by display index ascending
                expect(elasticsearch.client.search.mock.calls[0][0].sort).toEqual([
                    {
                        sortIndex: {
                            order: "asc",
                        },
                    },
                ])
            })

        it("returns an empty array when ES has no companies",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([]),
                )

                const result = await handler.execute(
                    new HeadhunterCompaniesQuery({
                        request: {
                        },
                    }),
                )

                expect(result).toEqual([])
            })
    })
