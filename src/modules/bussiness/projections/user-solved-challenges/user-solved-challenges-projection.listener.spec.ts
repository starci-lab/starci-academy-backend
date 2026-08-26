import {
    UserSolvedChallengesProjectionListener
} from "./user-solved-challenges-projection.listener"

describe("UserSolvedChallengesProjectionListener",
    () => {
        it("maps a submission attempt to its owner and handles deleted submissions",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    user_id: "user-1"
                }]).mockResolvedValueOnce([])
                const recompute = jest.fn().mockResolvedValue(undefined)
                const listener = new UserSolvedChallengesProjectionListener(
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
                        user_challenge_submission_id: "submission-1"
                    }
                })).resolves.toEqual(["user-1"])
                await expect(listener.deriveTargets({
                    row: {
                        user_challenge_submission_id: "submission-2"
                    }
                })).resolves.toEqual([])
                await expect(listener.deriveTargets({
                    row: {
                    }
                })).resolves.toEqual([])
                await listener.recomputeTarget("user-1")
                expect(recompute).toHaveBeenCalledWith({
                    userId: "user-1"
                })
            })
    })
