import {
    AiModelCategory,
} from "@modules/databases"
import {
    gradingFloorForDifficulty,
    resolveGradingChain,
} from "./resolve-grading-chain"

describe("gradingFloorForDifficulty",
    () => {
        it("maps each known difficulty to its floor category",
            () => {
                expect(gradingFloorForDifficulty("easy")).toBe(AiModelCategory.Economy)
                expect(gradingFloorForDifficulty("medium")).toBe(AiModelCategory.Balanced)
                expect(gradingFloorForDifficulty("hard")).toBe(AiModelCategory.Premium)
                expect(gradingFloorForDifficulty("insane")).toBe(AiModelCategory.Frontier)
                expect(gradingFloorForDifficulty("expert")).toBe(AiModelCategory.Frontier)
            })

        it("is case-insensitive",
            () => {
                // callers may forward the raw enum-ish string as typed by an admin/config
                expect(gradingFloorForDifficulty("HARD")).toBe(AiModelCategory.Premium)
            })

        it("falls back to Economy for null, undefined, and unknown difficulty",
            () => {
                expect(gradingFloorForDifficulty(null)).toBe(AiModelCategory.Economy)
                expect(gradingFloorForDifficulty(undefined)).toBe(AiModelCategory.Economy)
                expect(gradingFloorForDifficulty("nonsense")).toBe(AiModelCategory.Economy)
            })
    })

describe("resolveGradingChain",
    () => {
        const ALL = [
            AiModelCategory.Free,
            AiModelCategory.Economy,
            AiModelCategory.Balanced,
            AiModelCategory.Premium,
            AiModelCategory.Frontier,
        ]

        it("climbs from floor to the ladder top when no ceil is given",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Economy,
                        tierCategories: ALL,
                    }),
                ).toEqual([
                    AiModelCategory.Economy,
                    AiModelCategory.Balanced,
                    AiModelCategory.Premium,
                    AiModelCategory.Frontier,
                ])
            })

        it("caps the climb at ceil when given",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Balanced,
                        tierCategories: ALL,
                        ceil: AiModelCategory.Premium,
                    }),
                ).toEqual([
                    AiModelCategory.Balanced,
                    AiModelCategory.Premium,
                ])
            })

        it("returns a single-entry chain when floor equals ceil",
            () => {
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Balanced,
                        tierCategories: ALL,
                        ceil: AiModelCategory.Balanced,
                    }),
                ).toEqual([AiModelCategory.Balanced])
            })

        it("excludes ladder categories the tier does not entitle",
            () => {
                // Premium is skipped even though it sits inside [floor, ceil] on the
                // ladder — the tier simply does not unlock it.
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Economy,
                        tierCategories: [
                            AiModelCategory.Free,
                            AiModelCategory.Economy,
                            AiModelCategory.Balanced,
                            AiModelCategory.Frontier,
                        ],
                        ceil: AiModelCategory.Frontier,
                    }),
                ).toEqual([
                    AiModelCategory.Economy,
                    AiModelCategory.Balanced,
                    AiModelCategory.Frontier,
                ])
            })

        it("clamps down to the highest entitled grading category when floor is above ceil",
            () => {
                // docstring example: an insane task (floor=Frontier) on a tier capped
                // at Economy — the raw [floor, ceil] window is empty, so we clamp down
                // to the single best category still >= Economy that the tier allows.
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Frontier,
                        tierCategories: [
                            AiModelCategory.Free,
                            AiModelCategory.Economy,
                        ],
                    }),
                ).toEqual([AiModelCategory.Economy])
            })

        it("clamps to the highest entitled category, not necessarily Economy",
            () => {
                // clamp path picks the TOP of what the tier allows at/above Economy,
                // not Economy itself.
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Frontier,
                        tierCategories: [
                            AiModelCategory.Free,
                            AiModelCategory.Economy,
                            AiModelCategory.Balanced,
                        ],
                    }),
                ).toEqual([AiModelCategory.Balanced])
            })

        it("falls back to [Economy] as the hard floor when the tier unlocks nothing at/above Economy",
            () => {
                // tierCategories only entitles Free, which is below the Economy grading
                // floor — both the direct chain and the clamp path come up empty, so the
                // function returns the documented hard default of [Economy].
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Frontier,
                        tierCategories: [AiModelCategory.Free],
                    }),
                ).toEqual([AiModelCategory.Economy])
            })

        it("ignores an explicit ceil once the [floor, ceil] window is empty (clamp path)",
            () => {
                // an admin/user-set ceil narrower than the floor makes [floor, ceil]
                // empty, same as the implicit-ceil clamp above — but the clamp
                // fallback (lines 80-87) re-scans the FULL ladder from Economy up
                // against `tierCategories` only, `ceil` is not consulted there. So
                // the narrow `ceil` does NOT limit the clamped result: with the full
                // tier entitled, the clamp still lands on the tier's true top (Frontier),
                // not on the `ceil` that triggered the clamp.
                expect(
                    resolveGradingChain({
                        floor: AiModelCategory.Premium,
                        tierCategories: ALL,
                        ceil: AiModelCategory.Economy,
                    }),
                ).toEqual([AiModelCategory.Frontier])
            })
    })
