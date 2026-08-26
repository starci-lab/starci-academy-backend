import {
    UserFlashcardCourseStatsProjectionListener
} from "./user-flashcard-course-stats-projection.listener"

describe("UserFlashcardCourseStatsProjectionListener",
    () => {
        it("derives only rows with an enrollment and recomputes it",
            async () => {
                const recompute = jest.fn().mockResolvedValue(undefined)
                const listener = new UserFlashcardCourseStatsProjectionListener(
            {
            } as never,
            {
            } as never,
            {
                recompute
            } as never,
                ) as unknown as {
            deriveTargets: (message: unknown) => string[]
            recomputeTarget: (id: string) => Promise<void>
        }
                expect(listener.deriveTargets({
                    row: {
                        enrollment_id: "enrollment-1"
                    }
                })).toEqual(["enrollment-1"])
                expect(listener.deriveTargets({
                    row: {
                        enrollment_id: ""
                    }
                })).toEqual([])
                await listener.recomputeTarget("enrollment-1")
                expect(recompute).toHaveBeenCalledWith({
                    enrollmentId: "enrollment-1"
                })
            })
    })
