import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ModelProvider,
} from "@modules/databases"
import {
    WinstonService,
} from "@modules/winston"
import {
    GradeModelRouterService,
} from "./grade-model-router.service"
import {
    AiPingService,
} from "./ping"

/**
 * Exercises the shared {@link AbstractModelRouterService} logic through the
 * concrete grading router (tier resolution, reactive failover, proactive
 * quota re-check). The default env tier is "low" → grading chain is
 * [qwen2.5-coder:7b (Local), gpt-5.4-nano (OpenAI), gemini-2.5-flash-lite (Gemini)]
 * — the free Auto lane runs the self-hosted Qwen first, then economy cloud.
 */
describe("GradeModelRouterService",
    () => {
        let module: TestingModule
        let service: GradeModelRouterService
        let aiPingService: jest.Mocked<Pick<AiPingService, "listKeysForProvider" | "pingKey">>

        beforeEach(async () => {
            // ping service: every provider has a key and pings healthy by default
            aiPingService = {
                listKeysForProvider: jest.fn(() => [
                    "sk-key",
                ]),
                pingKey: jest.fn(async () => ({
                    success: true,
                    errorMessage: null,
                })),
            } as unknown as jest.Mocked<Pick<AiPingService, "listKeysForProvider" | "pingKey">>

            module = await Test.createTestingModule({
                providers: [
                    GradeModelRouterService,
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                    {
                        provide: AiPingService,
                        useValue: aiPingService,
                    },
                ],
            }).compile()

            service = module.get<GradeModelRouterService>(GradeModelRouterService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("resolve",
            () => {
                it("picks the primary model in the chain when all providers are available",
                    () => {
                        // fresh router → no provider marked unavailable → primary (local Qwen) wins
                        service.resolve()

                        expect(service.current).toEqual({
                            model: "qwen2.5-coder:7b",
                            provider: ModelProvider.Local,
                        })
                    })
            })

        describe("failure",
            () => {
                it("marks a provider unavailable and switches to the next fallback",
                    () => {
                        // local Qwen down → fail over to the next fallback (gpt-5.4-nano)
                        service.failure(ModelProvider.Local)

                        expect(service.current).toEqual({
                            model: "gpt-5.4-nano",
                            provider: ModelProvider.OpenAI,
                        })
                    })

                it("forces the first chain entry when every provider is unavailable",
                    () => {
                        // every provider down → fall back to the chain head (local Qwen) regardless
                        service.failure(ModelProvider.Local)
                        service.failure(ModelProvider.OpenAI)
                        service.failure(ModelProvider.Gemini)

                        expect(service.current).toEqual({
                            model: "qwen2.5-coder:7b",
                            provider: ModelProvider.Local,
                        })
                    })
            })

        describe("checkQuota",
            () => {
                it("clears the unavailable flag when a provider pings healthy again",
                    async () => {
                        // local Qwen was down; a healthy ping must restore it as primary
                        service.failure(ModelProvider.Local)
                        aiPingService.pingKey.mockResolvedValue({
                            success: true,
                            errorMessage: null,
                        })

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.Local)
                    })

                it("keeps a provider unavailable when its ping fails",
                    async () => {
                        // local Qwen keeps failing → router stays on the next fallback (OpenAI)
                        aiPingService.pingKey.mockImplementation(
                            async ({
                                provider,
                            }) => ({
                                success: provider !== ModelProvider.Local,
                                errorMessage: null,
                            }),
                        )

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.OpenAI)
                    })

                it("treats a provider with no keys as unavailable",
                    async () => {
                        // no key for local Qwen → cannot ping → unavailable, use the next fallback (OpenAI)
                        aiPingService.listKeysForProvider.mockImplementation(
                            (provider) =>
                                (provider === ModelProvider.Local ? [] : [
                                    "sk-key",
                                ]),
                        )

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.OpenAI)
                    })
            })
    })
