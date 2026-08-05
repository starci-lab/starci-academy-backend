import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    GRADING_FLOOR_CATEGORY,
    resolveGradingChain,
} from "./resolve-grading-chain"

describe("GRADING_FLOOR_CATEGORY",
    () => {
        it("is the balanced rung — every automatic grading run lands here",
            () => {
                // difficulty used to pick the rung (easy->Economy ... insane->Frontier);
                // it no longer does. Easy and insane submissions grade on the same
                // model, because the rubric the prompt carries does the discriminating.
                expect(GRADING_FLOOR_CATEGORY).toBe(AiModelCategory.Medium)
            })
    })

describe("resolveGradingChain",
    () => {
        const ALL = [
            AiModelCategory.Low,
            AiModelCategory.Medium,
            AiModelCategory.High,
        ]

        describe("the automatic lane never escalates into the frontier model",
            () => {
                it("stops at the grading category even when the plan entitles everything",
                    () => {
                        expect(
                            resolveGradingChain({
                                floor: GRADING_FLOOR_CATEGORY,
                                tierCategories: ALL,
                            }),
                        ).toEqual([AiModelCategory.Medium])
                    })

                it("ignores a ceil that would raise the climb past the grading category",
                    () => {
                        // a user asking for Frontier via the per-feature cap still does
                        // not get it automatically -- only pinning the model does
                        expect(
                            resolveGradingChain({
                                floor: GRADING_FLOOR_CATEGORY,
                                tierCategories: ALL,
                                ceil: AiModelCategory.High,
                            }),
                        ).toEqual([AiModelCategory.Medium])
                    })

                it("never yields Frontier from a lower floor either",
                    () => {
                        const chain = resolveGradingChain({
                            floor: AiModelCategory.Low,
                            tierCategories: ALL,
                        })
                        expect(chain).not.toContain(AiModelCategory.High)
                        expect(chain).not.toContain(AiModelCategory.High)
                    })
            })

        it("climbs from a lower floor up to the grading category",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Low,
                        tierCategories: ALL,
                    }),
                ).toEqual([
                    AiModelCategory.Low,
                    AiModelCategory.Medium,
                ])
            })

        it("honours a ceil that lowers the climb below the grading category",
            () => {
                // a cap may only ever narrow the window, never widen it
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Low,
                        tierCategories: ALL,
                        ceil: AiModelCategory.Low,
                    }),
                ).toEqual([
                    AiModelCategory.Low,
                ])
            })

        it("excludes ladder categories the tier does not entitle",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Low,
                        tierCategories: [
                            AiModelCategory.Low,
                            AiModelCategory.Medium,
                        ],
                    }),
                ).toEqual([
                    AiModelCategory.Low,
                    AiModelCategory.Medium,
                ])
            })

        it("falls back to the grading category rather than an empty chain",
            () => {
                // a tier entitling nothing in the window would otherwise yield [],
                // and an empty chain fails the run outright
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Medium,
                        tierCategories: [AiModelCategory.Low],
                    }),
                ).toEqual([GRADING_FLOOR_CATEGORY])
            })

        it("falls back when the floor sits above the capped ceiling",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.High,
                        tierCategories: ALL,
                    }),
                ).toEqual([GRADING_FLOOR_CATEGORY])
            })
    })
