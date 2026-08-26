import {
    UserCapstoneProjectionListener
} from "./user-capstone-projection.listener"

describe("UserCapstoneProjectionListener",
    () => {
        it("resolves the owner through the task lookup and skips missing rows",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    user_id: "user-1"
                }]).mockResolvedValueOnce([]).mockResolvedValueOnce([])
                const recompute = jest.fn().mockResolvedValue(undefined)
                const listener = new UserCapstoneProjectionListener(
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
                        user_milestone_task_id: "task-1"
                    }
                })).resolves.toEqual(["user-1"])
                await expect(listener.deriveTargets({
                    row: {
                        user_milestone_task_id: "task-2"
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
