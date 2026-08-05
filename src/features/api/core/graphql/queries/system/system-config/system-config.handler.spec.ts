// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    SystemConfigHandler,
} from "./system-config.handler"
import {
    SystemConfigQuery,
} from "./system-config.query"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"

describe("SystemConfigHandler",
    () => {
        let module: TestingModule
        let handler: SystemConfigHandler
        let mountFilesystemService: jest.Mocked<Pick<MountFilesystemService, "appConfig">>
        let aiAutoQuotaConfigService: jest.Mocked<Pick<AiAutoQuotaConfigService, "getAutoQuota">>

        beforeEach(async () => {
            // app.yaml stub: only the systemConfig.challenge/task blocks are read
            mountFilesystemService = {
                appConfig: jest.fn(() => ({
                    systemConfig: {
                        challenge: {
                            maxAttempts: 3,
                        },
                        task: {
                            maxAttempts: 5,
                        },
                    },
                })),
            } as unknown as jest.Mocked<Pick<MountFilesystemService, "appConfig">>

            // free Auto-lane caps surfaced under ai.auto
            aiAutoQuotaConfigService = {
                getAutoQuota: jest.fn(() => ({
                    creditsPer5h: 50,
                    creditsPerWeek: 250,
                    creditCost: 10,
                })),
            } as unknown as jest.Mocked<Pick<AiAutoQuotaConfigService, "getAutoQuota">>

            module = await Test.createTestingModule({
                providers: [
                    SystemConfigHandler,
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: aiAutoQuotaConfigService,
                    },
                ],
            }).compile()

            handler = module.get<SystemConfigHandler>(SystemConfigHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("assembles challenge + task config and nests the Auto quota under ai",
            async () => {
                const result = await handler.execute(
                    new SystemConfigQuery({
                        // the query carries no request payload (ExecuteParams<undefined>)
                        request: undefined,
                    }),
                )

                expect(result.challenge).toEqual({
                    maxAttempts: 3,
                })
                expect(result.task).toEqual({
                    maxAttempts: 5,
                })
                expect(result.ai.auto).toEqual({
                    creditsPer5h: 50,
                    creditsPerWeek: 250,
                    creditCost: 10,
                })
            })
    })
