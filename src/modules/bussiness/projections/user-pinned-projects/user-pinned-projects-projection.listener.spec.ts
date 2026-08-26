import {
    UserPinnedProjectsProjectionListener
} from "./user-pinned-projects-projection.listener"

describe("UserPinnedProjectsProjectionListener",
    () => {
        it("resolves direct, enrollment, course, and unknown CDC targets",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    user_id: "user-2"
                }]).mockResolvedValueOnce([])
                const recompute = jest.fn().mockResolvedValue(undefined)
                const listener = new UserPinnedProjectsProjectionListener(
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
                    topic: "cdc.user_pinned_projects", row: {
                        user_id: "user-1"
                    }
                })).resolves.toEqual(["user-1"])
                await expect(listener.deriveTargets({
                    topic: "cdc.user_pinned_projects", row: {
                    }
                })).resolves.toEqual([])
                await expect(listener.deriveTargets({
                    topic: "cdc.enrollments", row: {
                        id: "enrollment-1"
                    }
                })).resolves.toEqual(["user-2"])
                await expect(listener.deriveTargets({
                    topic: "cdc.courses", row: {
                        id: "course-1"
                    }
                })).resolves.toEqual([])
                await expect(listener.deriveTargets({
                    topic: "cdc.unknown", row: {
                        id: "x"
                    }
                })).resolves.toEqual([])
                await listener.recomputeTarget("user-1")
                expect(recompute).toHaveBeenCalledWith({
                    userId: "user-1"
                })
            })
    })
