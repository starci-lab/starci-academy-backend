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
 * [gpt-4o-mini (OpenAI), gemini-2.0-flash (Gemini)].
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
                        // fresh router → no provider marked unavailable → primary wins
                        service.resolve()

                        expect(service.current).toEqual({
                            model: "gpt-4o-mini",
                            provider: ModelProvider.OpenAI,
                        })
                    })
            })

        describe("failure",
            () => {
                it("marks a provider unavailable and switches to the next fallback",
                    () => {
                        // OpenAI quota error → fail over to the Gemini fallback
                        service.failure(ModelProvider.OpenAI)

                        expect(service.current).toEqual({
                            model: "gemini-2.0-flash",
                            provider: ModelProvider.Gemini,
                        })
                    })

                it("forces the first chain entry when every provider is unavailable",
                    () => {
                        // both providers down → fall back to the chain head regardless
                        service.failure(ModelProvider.OpenAI)
                        service.failure(ModelProvider.Gemini)

                        expect(service.current).toEqual({
                            model: "gpt-4o-mini",
                            provider: ModelProvider.OpenAI,
                        })
                    })
            })

        describe("checkQuota",
            () => {
                it("clears the unavailable flag when a provider pings healthy again",
                    async () => {
                        // OpenAI was down; a healthy ping must restore it as primary
                        service.failure(ModelProvider.OpenAI)
                        aiPingService.pingKey.mockResolvedValue({
                            success: true,
                            errorMessage: null,
                        })

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.OpenAI)
                    })

                it("keeps a provider unavailable when its ping fails",
                    async () => {
                        // OpenAI keeps failing → router stays on the Gemini fallback
                        aiPingService.pingKey.mockImplementation(
                            async ({
                                provider,
                            }) => ({
                                success: provider !== ModelProvider.OpenAI,
                                errorMessage: null,
                            }),
                        )

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.Gemini)
                    })

                it("treats a provider with no keys as unavailable",
                    async () => {
                        // no key for OpenAI → cannot ping → unavailable, use Gemini
                        aiPingService.listKeysForProvider.mockImplementation(
                            (provider) =>
                                (provider === ModelProvider.OpenAI ? [] : [
                                    "sk-key",
                                ]),
                        )

                        await service.checkQuota()

                        expect(service.current.provider).toBe(ModelProvider.Gemini)
                    })
            })
    })
