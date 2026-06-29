import {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    resolveGradingInvokeOptions,
} from "./resolve-grading-invoke-options"
import type {
    AiEntitlementService,
} from "../ai-entitlement.service"

/**
 * Build a stub {@link AiEntitlementService} exposing the methods this helper
 * calls (`resolve`, `resolveTierCategories`), cast to the type. Grading is
 * System-only (BYOK removed).
 */
const makeEntitlementStub = (
    {
        tierCategories = [
            AiModelCategory.Free,
            AiModelCategory.Economy,
        ],
    }: {
        tierCategories?: Array<AiModelCategory>
    } = {
    },
): jest.Mocked<Pick<AiEntitlementService, "resolve" | "resolveTierCategories">> => ({
    // resolve only gates the lane (no fields read); never throws in these stubs
    resolve: jest.fn(async () => ({
    })),
    // the tier ceiling drives the climb chain
    resolveTierCategories: jest.fn(async () => tierCategories),
}) as unknown as jest.Mocked<Pick<AiEntitlementService, "resolve" | "resolveTierCategories">>

const userId = "user-1"

describe("resolveGradingInvokeOptions",
    () => {
        it("free tier + no selection → economy floor chain (capped at economy)",
            async () => {
                const entitlement = makeEntitlementStub()

                const result = await resolveGradingInvokeOptions({
                    userId,
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Economy,
                    ],
                })
            })

        it("paid tier + hard difficulty → premium floor, climbs to frontier",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [
                        AiModelCategory.Free,
                        AiModelCategory.Economy,
                        AiModelCategory.Balanced,
                        AiModelCategory.Premium,
                        AiModelCategory.Frontier,
                    ],
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                        mode: AiMode.Auto,
                    },
                    difficulty: "hard",
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Premium,
                        AiModelCategory.Frontier,
                    ],
                })
            })

        it("free tier + insane difficulty → clamps the high floor down to economy",
            async () => {
                const entitlement = makeEntitlementStub()

                const result = await resolveGradingInvokeOptions({
                    userId,
                    difficulty: "insane",
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Economy,
                    ],
                })
            })

        it("explicit Premium model pick → that pinned model (gated on entitlement)",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [
                        AiModelCategory.Free,
                        AiModelCategory.Economy,
                        AiModelCategory.Balanced,
                        AiModelCategory.Premium,
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
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
                // a Premium pick is gated on a paid entitlement
                expect(entitlement.resolve).toHaveBeenCalled()
            })
    })
