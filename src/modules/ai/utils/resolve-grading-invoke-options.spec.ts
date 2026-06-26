import {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import {
    resolveGradingInvokeOptions,
} from "./resolve-grading-invoke-options"
import type {
    AiEntitlementService,
} from "../ai-entitlement.service"

/**
 * Build a stub {@link AiEntitlementService} exposing only the two methods this
 * helper calls (`resolve` + `getByokApiKey`), cast to the full type.
 */
const makeEntitlementStub = (
    {
        allowedCategories = [
            AiModelCategory.Economy,
        ],
        storedKey = null,
    }: {
        allowedCategories?: Array<AiModelCategory>
        storedKey?: string | null
    } = {
    },
): jest.Mocked<Pick<AiEntitlementService, "resolve" | "getByokApiKey">> => ({
    // resolve only returns the fields the helper reads (allowedCategories)
    resolve: jest.fn(async () => ({
        allowedCategories,
    })),
    // getByokApiKey hands back the stored encrypted key (or null when none)
    getByokApiKey: jest.fn(async () => storedKey),
}) as unknown as jest.Mocked<Pick<AiEntitlementService, "resolve" | "getByokApiKey">>

const userId = "user-1"

describe("resolveGradingInvokeOptions",
    () => {
        it("runs the Economy chain on the Auto lane when no selection is supplied",
            () => {
                // absent selection → free Auto lane: balancer loops the Economy
                // chain (local Qwen first → economy cloud fallback), no pinned model
                const entitlement = makeEntitlementStub()

                return resolveGradingInvokeOptions({
                    userId,
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                }).then((result) => {
                    expect(result).toEqual({
                        categories: [
                            AiModelCategory.Free,
                            AiModelCategory.Economy,
                        ],
                    })
                    // Auto path never touches the entitlement resolver
                    expect(entitlement.resolve).not.toHaveBeenCalled()
                })
            })

        it("runs the Economy chain for an explicit Auto selection",
            async () => {
                // an explicit Auto pick behaves the same as no selection
                const entitlement = makeEntitlementStub()

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                        mode: AiMode.Auto,
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Free,
                        AiModelCategory.Economy,
                    ],
                })
            })

        it("maps a Premium selection to the best unlocked category + pinned model",
            async () => {
                // entitlement unlocks Balanced, so that category drives the invoke
                const entitlement = makeEntitlementStub({
                    allowedCategories: [
                        AiModelCategory.Economy,
                        AiModelCategory.Balanced,
                    ],
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                        mode: AiMode.Premium,
                        model: "gpt-4o",
                        provider: ModelProvider.OpenAI,
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    category: AiModelCategory.Balanced,
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
            })

        it("uses the inline BYOK key without loading the stored one",
            async () => {
                // an inline key bypasses the encrypted-key lookup entirely
                const entitlement = makeEntitlementStub()

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                        mode: AiMode.Byok,
                        model: "gpt-4o-mini",
                        provider: ModelProvider.OpenAI,
                        apiKey: "  sk-inline  ",
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    byok: {
                        provider: ModelProvider.OpenAI,
                        model: "gpt-4o-mini",
                        key: "sk-inline",
                    },
                })
                // the stored key was never read because the inline key won
                expect(entitlement.getByokApiKey).not.toHaveBeenCalled()
            })

        it("falls back to the stored BYOK key when none is supplied inline",
            async () => {
                // no inline key → load the encrypted key off the subscription
                const entitlement = makeEntitlementStub({
                    storedKey: "sk-stored",
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                        mode: AiMode.Byok,
                        model: "gpt-4o-mini",
                        provider: ModelProvider.OpenAI,
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    byok: {
                        provider: ModelProvider.OpenAI,
                        model: "gpt-4o-mini",
                        key: "sk-stored",
                    },
                })
            })

        it("throws when a BYOK pick has no inline or stored key",
            async () => {
                // no usable key → fail loudly instead of dropping to Auto
                const entitlement = makeEntitlementStub({
                    storedKey: null,
                })

                await expect(
                    resolveGradingInvokeOptions({
                        userId,
                        selection: {
                            mode: AiMode.Byok,
                            model: "gpt-4o-mini",
                            provider: ModelProvider.OpenAI,
                        },
                        aiEntitlementService: entitlement as unknown as AiEntitlementService,
                    }),
                ).rejects.toBeInstanceOf(AiByokInvalidException)
            })
    })
