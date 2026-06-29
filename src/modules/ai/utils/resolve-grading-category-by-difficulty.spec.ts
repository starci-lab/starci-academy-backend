import {
    AiModelCategory,
} from "@modules/databases"
import {
    resolveGradingCategoryByDifficulty,
} from "./resolve-grading-category-by-difficulty"

describe("resolveGradingCategoryByDifficulty",
    () => {
        const FREE = [
            AiModelCategory.Free,
            AiModelCategory.Economy,
        ]
        const ALL = [
            AiModelCategory.Free,
            AiModelCategory.Economy,
            AiModelCategory.Balanced,
            AiModelCategory.Premium,
        ]

        it("clamps every difficulty to Economy for a free-tier ceiling",
            () => {
                for (const difficulty of [
                    "easy",
                    "medium",
                    "hard",
                    "insane",
                ]) {
                    expect(
                        resolveGradingCategoryByDifficulty({
                            difficulty,
                            allowedCategories: FREE,
                        }),
                    ).toBe(AiModelCategory.Economy)
                }
            })

        it("routes by difficulty when the tier unlocks everything",
            () => {
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "easy",
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Economy)
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "medium",
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Economy)
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "hard",
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Balanced)
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "insane",
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Premium)
            })

        it("treats null/unknown difficulty as medium → Economy",
            () => {
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: null,
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Economy)
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "weird",
                    allowedCategories: ALL,
                })).toBe(AiModelCategory.Economy)
            })

        it("never returns below Economy even with an empty/odd entitlement",
            () => {
                expect(resolveGradingCategoryByDifficulty({
                    difficulty: "insane",
                    allowedCategories: [],
                })).toBe(AiModelCategory.Economy)
            })
    })
