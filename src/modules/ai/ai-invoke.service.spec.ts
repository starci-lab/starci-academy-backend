import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiModelCatalogService,
    UseApiService,
} from "./balancer"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"

/**
 * Tests the lane-routing logic of {@link AiInvokeService.invoke}. The
 * underlying {@link UseApiService.useApi} is mocked so the LangChain client
 * build / network invoke (a thin SDK wrapper) never runs — only the
 * premium/auto branch + result mapping is under test.
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
                    result: {
                        text: "graded",
                        promptTokens: 0,
                        completionTokens: 0,
                    },
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
                    {
                        // only used by run() (not the low-level invoke/stream under test)
                        provide: AiEntitlementService,
                        useValue: {
                            resolveTierCategories: jest.fn(async () => []),
                            resolve: jest.fn(async () => ({
                            })),
                        },
                    },
                    {
                        provide: AiModelCatalogService,
                        useValue: {
                            creditForModel: jest.fn(async () => 0),
                            creditForRun: jest.fn(async () => 0),
                        },
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
                            promptTokens: 0,
                            completionTokens: 0,
                        })
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
                                lane: "pinned",
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
                                lane: "chain",
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
                                lane: "chain",
                            }),
                        )
                    })
            })

        // run() is the high-level entry every surface uses. These prove the
        // success mapping AND that a balancer exhaustion is NOT swallowed — it
        // rejects, so the gateway/handler surfaces the error to the client.
        describe("run",
            () => {
                it("returns the served model + cost on success",
                    async () => {
                        const result = await service.run({
                            userId: "user-1",
                            messages,
                        })

                        expect(result).toEqual(
                            expect.objectContaining({
                                text: "graded",
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                                attempts: 2,
                                cost: 0,
                            }),
                        )
                    })

                it("propagates a balancer exhaustion (surfaceable to the client)",
                    async () => {
                        // every model/key failed → the balancer throws; run must NOT
                        // swallow it (else the client would see a blank "success")
                        useApiService.useApi.mockRejectedValueOnce(
                            new Error("all models exhausted"),
                        )

                        await expect(
                            service.run({
                                userId: "user-1",
                                messages,
                            }),
                        ).rejects.toThrow("all models exhausted")
                    })
            })
    })
