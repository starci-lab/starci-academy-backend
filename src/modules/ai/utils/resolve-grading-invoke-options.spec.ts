import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
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
            AiModelCategory.Low,
            AiModelCategory.Low,
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
        it("free tier + no selection → the grading category, since the tier entitles it",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [
                        AiModelCategory.Low,
                        AiModelCategory.Low,
                        AiModelCategory.Medium,
                    ],
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Medium,
                    ],
                })
            })

        it("paid tier, no pin → still the grading category; nothing escalates automatically",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [
                        AiModelCategory.Low,
                        AiModelCategory.Low,
                        AiModelCategory.Medium,
                        AiModelCategory.High,
                        AiModelCategory.High,
                    ],
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    selection: {
                    },
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                // the plan unlocks Premium and Frontier, yet an unpinned run gets
                // neither -- reaching the frontier model requires picking it
                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Medium,
                    ],
                })
            })

        it("a tier entitling nothing in the window still yields the grading category",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [AiModelCategory.Low],
                })

                const result = await resolveGradingInvokeOptions({
                    userId,
                    aiEntitlementService: entitlement as unknown as AiEntitlementService,
                })

                expect(result).toEqual({
                    categories: [
                        AiModelCategory.Medium,
                    ],
                })
            })

        it("explicit pinned model → that pinned model (gated on entitlement)",
            async () => {
                const entitlement = makeEntitlementStub({
                    tierCategories: [
                        AiModelCategory.Low,
                        AiModelCategory.Low,
                        AiModelCategory.Medium,
                        AiModelCategory.High,
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
