import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AIMessageChunk,
    HumanMessage,
} from "@langchain/core/messages"
import {
    ChatOpenAI,
} from "@langchain/openai"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiModeNotEntitledException,
} from "@modules/platform/exceptions/errors/ai/ai-mode-not-entitled"
import {
    UnsupportedAiProviderException,
} from "@modules/platform/exceptions/errors/ai/unsupported-ai-provider"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiModelCatalogService,
} from "./balancer/ai-model-catalog.service"
import {
    UseApiService,
} from "./balancer/use-api.service"
import type {
    UseApiActionContext,
    UseApiParams,
} from "./balancer/types/use-api"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"

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

        // real LangChain message instances -- `AiInvokeParams.messages` is
        // `Array<BaseMessage>`, and a literal `{ role, content }` is not one.
        const messages = [
            new HumanMessage("hi"),
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
                        promptTokens: 100,
                        completionTokens: 20,
                        cachedTokens: 75,
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
                            promptTokens: 100,
                            completionTokens: 20,
                            cachedTokens: 75,
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

                it("withholds a failed attempt's partial output and flushes only the successful fallback",
                    async () => {
                        const streamSpy = jest.spyOn(ChatOpenAI.prototype,
                            "stream")
                        const failedAttempt = async function* () {
                            yield new AIMessageChunk("partial from model A")
                            throw Object.assign(new Error("provider unavailable"),
                                {
                                    status: 503,
                                })
                        }
                        const successfulAttempt = async function* () {
                            yield new AIMessageChunk("answer from ")
                            yield new AIMessageChunk({
                                content: "model B",
                                usage_metadata: {
                                    input_tokens: 12,
                                    output_tokens: 3,
                                    total_tokens: 15,
                                },
                            })
                        }
                        streamSpy
                            .mockImplementationOnce(async () => failedAttempt() as never)
                            .mockImplementationOnce(async () => successfulAttempt() as never)
                        const emitted: Array<string> = []
                        useApiService.useApi.mockImplementationOnce(
                            async (params: UseApiParams<unknown>) => {
                                await expect(params.action({
                                    provider: ModelProvider.Local,
                                    key: "local-a",
                                    model: "model-a",
                                } as UseApiActionContext)).rejects.toThrow("provider unavailable")
                                expect(emitted).toEqual([])
                                return {
                                    result: await params.action({
                                        provider: ModelProvider.Local,
                                        key: "local-b",
                                        model: "model-b",
                                    } as UseApiActionContext),
                                    model: "model-b",
                                    provider: ModelProvider.Local,
                                    attempts: 2,
                                }
                            },
                        )

                        try {
                            const result = await service.stream({
                                messages,
                                onChunk: (delta) => emitted.push(delta),
                            })

                            expect(emitted).toEqual([
                                "answer from ",
                                "model B",
                            ])
                            expect(result).toMatchObject({
                                text: "answer from model B",
                                model: "model-b",
                                attempts: 2,
                                promptTokens: 12,
                                completionTokens: 3,
                            })
                        } finally {
                            streamSpy.mockRestore()
                        }
                    })

                it("normalizes caller abort before emission so no fallback output escapes",
                    async () => {
                        const streamSpy = jest.spyOn(ChatOpenAI.prototype,
                            "stream")
                            .mockRejectedValue(new Error("provider-specific cancellation"))
                        const controller = new AbortController()
                        controller.abort()
                        useApiService.useApi.mockImplementationOnce(
                            async (params: UseApiParams<unknown>) => ({
                                result: await params.action({
                                    provider: ModelProvider.Local,
                                    key: "local-a",
                                    model: "model-a",
                                } as UseApiActionContext),
                                model: "model-a",
                                provider: ModelProvider.Local,
                                attempts: 1,
                            }),
                        )

                        try {
                            const onAbortedChunk = jest.fn()
                            await expect(service.stream({
                                messages,
                                onChunk: onAbortedChunk,
                                signal: controller.signal,
                            })).rejects.toMatchObject({
                                name: "AbortError",
                            })
                            expect(onAbortedChunk).not.toHaveBeenCalled()
                            expect(streamSpy).toHaveBeenCalledTimes(1)
                        } finally {
                            streamSpy.mockRestore()
                        }
                    })

                it("propagates UnsupportedAiProviderException from an unrecognized provider",
                    async () => {
                        // this time let useApi actually run the caller-supplied action
                        // against a context whose provider has no `buildClient` branch --
                        // the throw happens before any LangChain client is touched, so
                        // this stays network-free.
                        useApiService.useApi.mockImplementationOnce(
                            async (
                                params: UseApiParams<unknown>,
                            ) => ({
                                // the action throws before this wrapper is built --
                                // the fields exist only to satisfy `UseApiResult`
                                result: await params.action(unsupportedProviderContext),
                                model: "some-model",
                                provider: ModelProvider.OpenAI,
                                attempts: 1,
                            }),
                        )

                        await expect(
                            service.invoke({
                                messages,
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })

                // response.content is `string | MessageContentComplex[]` -- these
                // two run the real invokeAction (not the useApi shortcut) to prove
                // both shapes come out as usable text, never the collapsed
                // "[object Object]" a bare `String(response.content)` would produce
                // (S6551).
                it("returns a plain-string response content as-is",
                    async () => {
                        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
                            "invoke")
                            .mockResolvedValue({
                                content: "The answer is 42.",
                                usage_metadata: {
                                    input_tokens: 10,
                                    output_tokens: 5,
                                    total_tokens: 15,
                                },
                            } as never)
                        useApiService.useApi.mockImplementationOnce(
                            async (params: UseApiParams<unknown>) => ({
                                result: await params.action({
                                    provider: ModelProvider.Local,
                                    key: "local-a",
                                    model: "model-a",
                                } as UseApiActionContext),
                                model: "model-a",
                                provider: ModelProvider.Local,
                                attempts: 1,
                            }),
                        )

                        try {
                            const result = await service.invoke({
                                messages,
                            })

                            expect(result.text).toBe("The answer is 42.")
                        } finally {
                            invokeSpy.mockRestore()
                        }
                    })

                it("extracts the joined text from a multi-part response content instead of stringifying the array",
                    async () => {
                        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
                            "invoke")
                            .mockResolvedValue({
                                content: [
                                    {
                                        type: "text",
                                        text: "The answer is ",
                                    },
                                    {
                                        type: "image_url",
                                        image_url: "https://example.com/x.png",
                                    },
                                    {
                                        type: "text",
                                        text: "42.",
                                    },
                                ],
                                usage_metadata: {
                                    input_tokens: 10,
                                    output_tokens: 5,
                                    total_tokens: 15,
                                },
                            } as never)
                        useApiService.useApi.mockImplementationOnce(
                            async (params: UseApiParams<unknown>) => ({
                                result: await params.action({
                                    provider: ModelProvider.Local,
                                    key: "local-a",
                                    model: "model-a",
                                } as UseApiActionContext),
                                model: "model-a",
                                provider: ModelProvider.Local,
                                attempts: 1,
                            }),
                        )

                        try {
                            const result = await service.invoke({
                                messages,
                            })

                            expect(result.text).toBe("The answer is 42.")
                            expect(result.text).not.toContain("[object Object]")
                        } finally {
                            invokeSpy.mockRestore()
                        }
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
                            promptTokens: 100,
                            completionTokens: 20,
                            cachedTokens: 75,
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
                                params: UseApiParams<unknown>,
                            ) => ({
                                // the action throws before this wrapper is built --
                                // the fields exist only to satisfy `UseApiResult`
                                result: await params.action(unsupportedProviderContext),
                                model: "some-model",
                                provider: ModelProvider.OpenAI,
                                attempts: 1,
                            }),
                        )

                        await expect(
                            service.stream({
                                messages,
                                onChunk,
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })

                // chunk.content is `string | MessageContentComplex[]` identically to
                // invoke()'s response.content -- prove `foldStreamChunk` extracts the
                // joined text from a multi-part chunk instead of stringifying the
                // array to "[object Object]" (S6551).
                it("extracts the joined text from a multi-part stream chunk content instead of stringifying the array",
                    async () => {
                        const streamSpy = jest.spyOn(ChatOpenAI.prototype,
                            "stream")
                        const multiPartAttempt = async function* () {
                            yield new AIMessageChunk({
                                content: [
                                    {
                                        type: "text",
                                        text: "The answer is ",
                                    },
                                    {
                                        type: "image_url",
                                        image_url: "https://example.com/x.png",
                                    },
                                ],
                            })
                            yield new AIMessageChunk({
                                content: [
                                    {
                                        type: "text",
                                        text: "42.",
                                    },
                                ],
                                usage_metadata: {
                                    input_tokens: 10,
                                    output_tokens: 5,
                                    total_tokens: 15,
                                },
                            })
                        }
                        streamSpy.mockImplementationOnce(async () => multiPartAttempt() as never)
                        const emitted: Array<string> = []
                        useApiService.useApi.mockImplementationOnce(
                            async (params: UseApiParams<unknown>) => ({
                                result: await params.action({
                                    provider: ModelProvider.Local,
                                    key: "local-a",
                                    model: "model-a",
                                } as UseApiActionContext),
                                model: "model-a",
                                provider: ModelProvider.Local,
                                attempts: 1,
                            }),
                        )

                        try {
                            const result = await service.stream({
                                messages,
                                onChunk: (delta) => emitted.push(delta),
                            })

                            expect(emitted).toEqual([
                                "The answer is ",
                                "42.",
                            ])
                            expect(result.text).toBe("The answer is 42.")
                            expect(result.text).not.toContain("[object Object]")
                        } finally {
                            streamSpy.mockRestore()
                        }
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
                                promptTokens: 100,
                                completionTokens: 20,
                                cachedTokens: 75,
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
