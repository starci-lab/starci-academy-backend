import {
    AchievementProjectionListener
} from "./achievements.projection.listener"

describe("AchievementProjectionListener",
    () => {
        const makeListener = () => {
            const invalidate = jest.fn().mockResolvedValue(undefined)
            const listener = new AchievementProjectionListener(
            {
            } as never,
            {
            } as never,
            {
                invalidate,
            } as never,
            )
            return {
                listener: listener as unknown as {
                deriveTargets: (message: unknown) => Array<string>
                recomputeTarget: (userId: string) => Promise<void>
            },
                invalidate,
            }
        }

        it("targets the followed user for follow events and actor for other tables",
            () => {
                const { listener } = makeListener()

                expect(listener.deriveTargets({
                    topic: "cdc.user_follows",
                    row: {
                        user_id: "follower",
                        following_id: "followed",
                    },
                })).toEqual(["followed"])
                expect(listener.deriveTargets({
                    topic: "cdc.content_comments",
                    row: {
                        user_id: "commenter",
                    },
                })).toEqual(["commenter"])
            })

        it("skips rows without the relevant user and invalidates a concrete target",
            async () => {
                const { listener, invalidate } = makeListener()

                expect(listener.deriveTargets({
                    topic: "cdc.user_follows",
                    row: {
                        user_id: "follower",
                    },
                })).toEqual([])
                expect(listener.deriveTargets({
                    topic: "cdc.xp_histories",
                    row: {
                    },
                })).toEqual([])

                await listener.recomputeTarget("user-1")
                expect(invalidate).toHaveBeenCalledWith("user-1")
            })

        it("propagates invalidate failures",
            async () => {
                const { listener, invalidate } = makeListener()
                const failure = new Error("cache failure")
                invalidate.mockRejectedValueOnce(failure)
                await expect(listener.recomputeTarget("user-2")).rejects.toBe(failure)
            })
    })
