// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    MilestoneHandler,
} from "./milestone.handler"
import {
    MilestoneQuery,
} from "./milestone.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    MilestoneNotFoundException,
} from "@modules/platform/exceptions/errors/courses/milestone-not-found"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

describe("MilestoneHandler",
    () => {
        let module: TestingModule
        let handler: MilestoneHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { get: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "milestones-vi"),
                client: {
                    get: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { get: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    MilestoneHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<MilestoneHandler>(MilestoneHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns the document fetched by id from the locale index",
            async () => {
                elasticsearch.client.get.mockResolvedValueOnce({
                    _source: {
                        id: "ms-1",
                    },
                })

                const result = await handler.execute(
                    new MilestoneQuery({
                        request: {
                            id: "ms-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.id).toBe("ms-1")
                expect(elasticsearch.client.get).toHaveBeenCalledWith({
                    index: "milestones-vi",
                    id: "ms-1",
                })
            })

        it("throws not-found when the document has no source",
            async () => {
                elasticsearch.client.get.mockResolvedValueOnce({
                    _source: undefined,
                })

                await expect(
                    handler.execute(
                        new MilestoneQuery({
                            request: {
                                id: "ms-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(MilestoneNotFoundException)
            })

        it("maps an ES get failure to a not-found error",
            async () => {
                elasticsearch.client.get.mockRejectedValueOnce(
                    new Error("not_found"),
                )

                await expect(
                    handler.execute(
                        new MilestoneQuery({
                            request: {
                                id: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(MilestoneNotFoundException)
            })
    })
