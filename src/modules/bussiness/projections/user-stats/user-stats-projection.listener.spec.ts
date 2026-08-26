import {
    UserStatsProjectionListener
} from "./user-stats-projection.listener"

describe("UserStatsProjectionListener",
    () => {
        it("derives endpoint, XP, notification, and empty targets",
            async () => {
                const recompute = jest.fn().mockResolvedValue(undefined)
                const checkAndGrant = jest.fn().mockResolvedValue(undefined)
                const checkAndGrantDailyBonus = jest.fn().mockResolvedValue(undefined)
                const listener = new UserStatsProjectionListener(
            {
            } as never,
            {
            } as never,
            {
                recompute
            } as never,
            {
                checkAndGrant, checkAndGrantDailyBonus
            } as never,
                ) as unknown as {
            deriveTargets: (message: unknown) => string[]
            recomputeTarget: (id: string) => Promise<void>
        }
                expect(listener.deriveTargets({
                    topic: "cdc.user_follows", row: {
                        follower_id: "one", following_id: "two"
                    }
                })).toEqual(["one",
                    "two"])
                expect(listener.deriveTargets({
                    topic: "cdc.user_follows", row: {
                        follower_id: "one"
                    }
                })).toEqual(["one"])
                expect(listener.deriveTargets({
                    topic: "cdc.xp_histories", row: {
                        user_id: "xp-user"
                    }
                })).toEqual(["xp-user"])
                expect(listener.deriveTargets({
                    topic: "cdc.xp_histories", row: {
                    }
                })).toEqual([])
                expect(listener.deriveTargets({
                    topic: "cdc.notifications", row: {
                        user_id: "notify-user"
                    }
                })).toEqual(["notify-user"])
                expect(listener.deriveTargets({
                    topic: "cdc.notifications", row: {
                    }
                })).toEqual([])
                await listener.recomputeTarget("user-1")
                expect(recompute).toHaveBeenCalledWith({
                    userId: "user-1"
                })
                expect(checkAndGrant).toHaveBeenCalledWith("user-1")
                expect(checkAndGrantDailyBonus).toHaveBeenCalledWith("user-1")
            })

        it("preserves both endpoints when a follow row references the same user",
            () => {
                const listener = new UserStatsProjectionListener({
                } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never) as unknown as { deriveTargets: (message: unknown) => string[] }
                expect(listener.deriveTargets({
                    topic: "cdc.user_follows",
                    row: {
                        follower_id: "same", following_id: "same"
                    },
                })).toEqual(["same",
                    "same"])
            })
    })
