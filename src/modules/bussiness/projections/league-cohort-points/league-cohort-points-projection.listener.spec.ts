import {
    LeagueCohortPointsProjectionListener
} from "./league-cohort-points-projection.listener"

describe("LeagueCohortPointsProjectionListener",
    () => {
        it("maps placed earners and skips unplaced or malformed events",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    cohort_id: "cohort-1"
                }]).mockResolvedValueOnce([])
                const recompute = jest.fn().mockResolvedValue(undefined)
                const listener = new LeagueCohortPointsProjectionListener(
            {
            } as never,
            {
            } as never,
            {
                query
            } as never,
            {
                recompute
            } as never,
                ) as unknown as {
            deriveTargets: (message: unknown) => Promise<string[]>
            recomputeTarget: (id: string) => Promise<void>
        }
                await expect(listener.deriveTargets({
                    row: {
                        user_id: "user-1"
                    }
                })).resolves.toEqual(["cohort-1"])
                await expect(listener.deriveTargets({
                    row: {
                        user_id: "user-2"
                    }
                })).resolves.toEqual([])
                await expect(listener.deriveTargets({
                    row: {
                    }
                })).resolves.toEqual([])
                await listener.recomputeTarget("cohort-1")
                expect(recompute).toHaveBeenCalledWith({
                    cohortId: "cohort-1"
                })
            })
    })
