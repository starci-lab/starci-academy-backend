import {
    computeCompletionPercent,
} from "./compute-completion-percent"

const row = (overrides: Record<string, number>) => ({
    courseId: "course-1",
    path: "/courses/course-1",
    title: "Course",
    thumbnailUrl: null,
    contentCompleted: 0,
    contentTotal: 0,
    challengeCompleted: 0,
    challengeTotal: 0,
    completed: 0,
    total: 0,
    isEnrolled: true,
    ...overrides,
})

describe("computeCompletionPercent",
    () => {
        it("returns zero when no progress dimension has items",
            () => {
                expect(computeCompletionPercent(row({
                }))).toBe(0)
            })

        it("averages only present dimensions and caps over-completion",
            () => {
                expect(computeCompletionPercent(row({
                    contentCompleted: 12,
                    contentTotal: 10,
                    challengeCompleted: 1,
                    challengeTotal: 4,
                    completed: 2,
                    total: 4,
                }))).toBe(58)
            })

        it("handles a single milestone dimension without inventing absent ratios",
            () => {
                expect(computeCompletionPercent(row({
                    completed: 1,
                    total: 3,
                }))).toBe(33)
            })
    })
