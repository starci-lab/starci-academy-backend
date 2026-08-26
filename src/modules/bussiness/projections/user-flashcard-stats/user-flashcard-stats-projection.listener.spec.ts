import {
    UserFlashcardStatsProjectionListener,
} from "./user-flashcard-stats-projection.listener"

class InspectableUserFlashcardStatsListener extends UserFlashcardStatsProjectionListener {
    targets(row: Record<string, unknown>): Array<string> {
        return this.deriveTargets({
            row,
        } as never)
    }

    recompute(userId: string): Promise<void> {
        return this.recomputeTarget(userId)
    }
}

describe("UserFlashcardStatsProjectionListener",
    () => {
        it("derives the reviewer's id and skips rows without one",
            () => {
                const projection = {
                    recompute: jest.fn().mockResolvedValue(undefined),
                }
                const listener = new InspectableUserFlashcardStatsListener(
                    {
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    projection as never,
                )

                expect(listener.targets({
                    user_id: "user-1",
                    grade: 3,
                })).toEqual(["user-1"])
                expect(listener.targets({
                    user_id: null,
                })).toEqual([])
            })

        it("delegates recomputation to the projection service",
            async () => {
                const projection = {
                    recompute: jest.fn().mockResolvedValue(undefined),
                }
                const listener = new InspectableUserFlashcardStatsListener(
                    {
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    projection as never,
                )

                await listener.recompute("user-2")

                expect(projection.recompute).toHaveBeenCalledWith({
                    userId: "user-2",
                })
            })
    })
