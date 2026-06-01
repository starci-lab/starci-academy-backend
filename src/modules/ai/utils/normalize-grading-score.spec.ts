import {
    normalizeGradingScore,
} from "./normalize-grading-score"

describe("normalizeGradingScore",
    () => {
        it("rounds floating-point totals to integers",
            () => {
                expect(normalizeGradingScore(99.99999999999999)).toBe(100)
            })

        it("clamps negative values to zero",
            () => {
                expect(normalizeGradingScore(-1.2)).toBe(0)
            })

        it("returns zero for non-finite input",
            () => {
                expect(normalizeGradingScore(Number.NaN)).toBe(0)
            })
    })
