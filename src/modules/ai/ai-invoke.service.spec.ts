import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    UseApiService,
} from "./balancer"

/**
 * Tests the lane-routing logic of {@link AiInvokeService.invoke}. The
 * underlying {@link UseApiService.useApi} is mocked so the LangChain client
 * build / network invoke (a thin SDK wrapper) never runs — only the
 * byok/premium/auto branch + result mapping is under test.
 */
describe("AiInvokeService",
    () => {
        let module: TestingModule
        let service: AiInvokeService
        let useApiService: jest.Mocked<Pick<UseApiService, "useApi">>

        const messages = [
            {
                role: "user",
                content: "hi",
            },
        ]

        beforeEach(async () => {
            // useApi echoes a canned success without running the supplied action
            useApiService = {
                useApi: jest.fn(async () => ({
                    result: "graded",
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                    attempts: 2,
                })),
            } as unknown as jest.Mocked<Pick<UseApiService, "useApi">>

            module = await Test.createTestingModule({
                providers: [
                    AiInvokeService,
                    {
                        provide: UseApiService,
                        useValue: useApiService,
                    },
                ],
            }).compile()

            service = module.get<AiInvokeService>(AiInvokeService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("invoke",
            () => {
                it("maps the useApi result into the invoke result shape",
                    async () => {
                        const result = await service.invoke({
                            messages,
                        })

                        expect(result).toEqual({
                            text: "graded",
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            attempts: 2,
                        })
                    })

                it("routes a BYOK request onto the Byok lane with the user's key",
                    async () => {
                        await service.invoke({
                            messages,
                            byok: {
                                provider: ModelProvider.OpenAI,
                                model: "gpt-4o-mini",
                                key: "sk-user",
                            },
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: AiMode.Byok,
                                provider: ModelProvider.OpenAI,
                                model: "gpt-4o-mini",
                                key: "sk-user",
                            }),
                        )
                    })

                it("routes a non-Economy category onto the Premium lane",
                    async () => {
                        // a Balanced category pins the Premium lane
                        await service.invoke({
                            messages,
                            category: AiModelCategory.Balanced,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: AiMode.Premium,
                                category: AiModelCategory.Balanced,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                    })

                it("routes the Economy category onto the Auto lane",
                    async () => {
                        // Economy is the free fallback chain, not Premium
                        await service.invoke({
                            messages,
                            category: AiModelCategory.Economy,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: AiMode.Auto,
                                category: AiModelCategory.Economy,
                            }),
                        )
                    })

                it("routes a category-less request onto the Auto lane",
                    async () => {
                        // no category → balancer-driven Auto fallback chain
                        await service.invoke({
                            messages,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: AiMode.Auto,
                            }),
                        )
                    })
            })
    })
