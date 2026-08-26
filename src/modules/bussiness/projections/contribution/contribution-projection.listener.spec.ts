import {
    ContributionProjectionListener
} from "./contribution-projection.listener"

describe("ContributionProjectionListener",
    () => {
        const makeListener = () => {
            const recompute = jest.fn().mockResolvedValue(undefined)
            const listener = new ContributionProjectionListener(
            {
            } as never,
            {
            } as never,
            {
                recompute,
            } as never,
            )
            return {
                listener: listener as unknown as {
                deriveTargets: (message: unknown) => Array<string>
                recomputeTarget: (userId: string) => Promise<void>
            },
                recompute,
            }
        }

        it("targets the activity actor and skips rows without a user",
            () => {
                const { listener } = makeListener()
                expect(listener.deriveTargets({
                    topic: "cdc.activities",
                    row: {
                        user_id: "user-1",
                    },
                })).toEqual(["user-1"])
                expect(listener.deriveTargets({
                    topic: "cdc.activities",
                    row: {
                    },
                })).toEqual([])
            })

        it("recomputes the actor's current calendar year",
            async () => {
                const { listener, recompute } = makeListener()
                const year = new Date().getFullYear()

                await listener.recomputeTarget("user-2")

                expect(recompute).toHaveBeenCalledWith({
                    userId: "user-2",
                    year,
                })
            })

        it("propagates projection failures",
            async () => {
                const { listener, recompute } = makeListener()
                const failure = new Error("projection unavailable")
                recompute.mockRejectedValueOnce(failure)

                await expect(listener.recomputeTarget("user-3")).rejects.toBe(failure)
            })
    })
