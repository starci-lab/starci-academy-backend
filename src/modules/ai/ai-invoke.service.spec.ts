import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    AiModeNotEntitledException,
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiModelCatalogService,
    UseApiService,
} from "./balancer"
import type {
    UseApiActionContext,
    UseApiParams,
} from "./balancer"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import type {
    StreamActionResult,
} from "./types"

/**
 * Tests the lane-routing logic of {@link AiInvokeService.invoke} and
 * {@link AiInvokeService.stream}, plus {@link AiInvokeService.run}'s success
 * mapping + error propagation. {@link UseApiService.useApi} is mocked so the
 * LangChain client build / network invoke (a thin SDK wrapper) never runs for
 * the happy-path cases -- only the premium/auto branch + result mapping is
 * under test. The `UnsupportedAiProviderException` cases are the one
 * exception: they let the mock run the real caller-supplied action, but the
 * private `buildClient` throws before touching any LangChain client or the
 * network, so this stays fully offline.
 */
describe("AiInvokeService",
    () => {
        let module: TestingModule
        let service: AiInvokeService
        let useApiService: jest.Mocked<Pick<UseApiService, "useApi">>
        let aiEntitlementService: jest.Mocked<
            Pick<AiEntitlementService, "resolveTierCategories" | "assertCanUsePaidModels">
        >

        const messages = [
            {
                role: "user",
                content: "hi",
            },
        ]

        // a rotator context whose `provider` matches no `buildClient` branch --
        // simulates a catalog/config value drifting ahead of the enum switch.
        // Cast through `unknown` because the real union type has no such member.
        const unsupportedProviderContext = {
            provider: "unsupported-provider",
            key: "key",
            model: "some-model",
        } as unknown as UseApiActionContext

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

            aiEntitlementService = {
                resolveTierCategories: jest.fn(async () => []),
                // happy-path default: paid/enrolled gate passes
                assertCanUsePaidModels: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<
                Pick<AiEntitlementService, "resolveTierCategories" | "assertCanUsePaidModels">
            >

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
                        useValue: aiEntitlementService,
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
                            category: AiModelCategory.Medium,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "pinned",
                                category: AiModelCategory.Medium,
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
                            category: AiModelCategory.Low,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "chain",
                                category: AiModelCategory.Low,
                            }),
                        )
                    })

                it("routes a category-less request onto the Auto lane",
                    async () => {
                        // no category -> balancer-driven Auto fallback chain
                        await service.invoke({
                            messages,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "chain",
                            }),
                        )
                    })

                it("propagates UnsupportedAiProviderException from an unrecognized provider",
                    async () => {
                        // this time let useApi actually run the caller-supplied action
                        // against a context whose provider has no `buildClient` branch --
                        // the throw happens before any LangChain client is touched, so
                        // this stays network-free.
                        useApiService.useApi.mockImplementationOnce(
                            async (
                                params: UseApiParams<StreamActionResult>,
                            ) => params.action(unsupportedProviderContext),
                        )

                        await expect(
                            service.invoke({
                                messages,
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })
            })

        // stream() mirrors invoke() lane-for-lane; onChunk itself is exercised
        // by the balancer/action internals, out of scope for this lane-routing
        // + result-mapping test (useApi is mocked, so the real streamAction never runs).
        describe("stream",
            () => {
                const onChunk = jest.fn()

                it("maps the useApi result into the stream result shape",
                    async () => {
                        const result = await service.stream({
                            messages,
                            onChunk,
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
                        await service.stream({
                            messages,
                            onChunk,
                            category: AiModelCategory.Medium,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "pinned",
                                category: AiModelCategory.Medium,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                    })

                it("routes a category-less request onto the Auto lane",
                    async () => {
                        // no category -> balancer-driven Auto fallback chain
                        await service.stream({
                            messages,
                            onChunk,
                        })

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "chain",
                            }),
                        )
                    })

                it("propagates UnsupportedAiProviderException from an unrecognized provider",
                    async () => {
                        // same network-free path as invoke(): buildClient throws before
                        // the stream ever touches the underlying LangChain client.
                        useApiService.useApi.mockImplementationOnce(
                            async (
                                params: UseApiParams<StreamActionResult>,
                            ) => params.action(unsupportedProviderContext),
                        )

                        await expect(
                            service.stream({
                                messages,
                                onChunk,
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })
            })

        // run() is the high-level entry every surface uses. These prove the
        // success mapping AND that a balancer exhaustion is NOT swallowed -- it
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
                        // every model/key failed -> the balancer throws; run must NOT
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

                it("propagates AiModeNotEntitledException for premium-only content without entitlement",
                    async () => {
                        // allowFreeAuto: false -> resolveGradingInvokeOptions requires the
                        // paid/enrolled gate; an unentitled user must reject, not silently
                        // downgrade to the free lane.
                        aiEntitlementService.assertCanUsePaidModels.mockRejectedValueOnce(
                            new AiModeNotEntitledException({
                                reason: "no active paid subscription or enrollment",
                            }),
                        )

                        await expect(
                            service.run({
                                userId: "user-1",
                                messages,
                                allowFreeAuto: false,
                            }),
                        ).rejects.toBeInstanceOf(AiModeNotEntitledException)
                        // the balancer must never be reached when the gate rejects
                        expect(useApiService.useApi).not.toHaveBeenCalled()
                    })
            })
    })
