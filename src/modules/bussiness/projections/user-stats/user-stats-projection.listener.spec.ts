import {
    UserStatsProjectionListener
} from "./user-stats-projection.listener"

describe("UserStatsProjectionListener",
    () => {
        const service = {
            recompute: jest.fn().mockResolvedValue(undefined)
        }
        const streak = {
            checkAndGrant: jest.fn().mockResolvedValue(undefined), checkAndGrantDailyBonus: jest.fn().mockResolvedValue(undefined)
        }
        const listener = new UserStatsProjectionListener({
        } as never,
{
} as never,
service as never,
streak as never)
        const exposedListener = listener as unknown as {
            deriveTargets: (event: unknown) => string[]
            recomputeTarget: (userId: string) => Promise<void>
        }

        beforeEach(() => jest.clearAllMocks())

        it("derives both unique follow endpoints",
            () => {
                expect(exposedListener.deriveTargets({
                    topic: "cdc.user_follows", row: {
                        follower_id: "u1", following_id: "u1"
                    }
                })).toEqual(["u1",
                    "u1"])
            })

        it("skips missing XP and notification users",
            () => {
                expect(exposedListener.deriveTargets({
                    topic: "cdc.xp_histories", row: {
                    }
                })).toEqual([])
                expect(exposedListener.deriveTargets({
                    topic: "cdc.notifications", row: {
                    }
                })).toEqual([])
            })

        it("recomputes stats and grants both streak bonuses",
            async () => {
                await exposedListener.recomputeTarget("user-1")
                expect(service.recompute).toHaveBeenCalledWith({
                    userId: "user-1"
                })
                expect(streak.checkAndGrant).toHaveBeenCalledWith("user-1")
                expect(streak.checkAndGrantDailyBonus).toHaveBeenCalledWith("user-1")
            })
    })
