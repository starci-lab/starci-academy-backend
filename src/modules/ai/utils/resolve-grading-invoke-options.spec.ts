import {
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
 * calls (`assertCanUsePaidModels`, `resolveTierCategories`), cast to the type.
 * Grading is System-only (BYOK removed); paid-model picks gate on paid OR enroll.
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
): jest.Mocked<Pick<AiEntitlementService, "assertCanUsePaidModels" | "resolveTierCategories">> => ({
    // the paid-model gate (paid OR enrolled); never throws in these stubs
    assertCanUsePaidModels: jest.fn(async () => undefined),
    // the tier ceiling drives the climb chain
    resolveTierCategories: jest.fn(async () => tierCategories),
}) as unknown as jest.Mocked<Pick<AiEntitlementService, "assertCanUsePaidModels" | "resolveTierCategories">>

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

        it("explicit pinned model → that pinned model (gated on entitlement)",
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
                        model: "gpt-4o",
                        provider: ModelProvider.OpenAI,
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
                // a pinned model is gated on the paid-OR-enrolled unlock
                expect(entitlement.assertCanUsePaidModels).toHaveBeenCalled()
            })
    })
