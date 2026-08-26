import {
    UserPinnedProjectsProjectionListener,
} from "./user-pinned-projects-projection.listener"

class TestListener extends UserPinnedProjectsProjectionListener {
    derive(message: { topic: string; row: unknown }): Promise<Array<string>> {
        return this.deriveTargets(message as never)
    }
    recompute(userId: string): Promise<void> {
        return this.recomputeTarget(userId)
    }
}

describe("UserPinnedProjectsProjectionListener",
    () => {
        const entityManager = {
            query: jest.fn()
        }
        const projection = {
            recompute: jest.fn()
        }
        const listener = new TestListener({
        } as never,
{
} as never,
entityManager as never,
projection as never)

        beforeEach(() => jest.clearAllMocks())

        it("derives a direct pin owner and ignores malformed rows",
            async () => {
                await expect(listener.derive({
                    topic: "prefix.user_pinned_projects", row: {
                        user_id: "u-1"
                    }
                })).resolves.toEqual(["u-1"])
                await expect(listener.derive({
                    topic: "prefix.user_pinned_projects", row: {
                    }
                })).resolves.toEqual([])
            })

        it("resolves enrollment/course owners and recomputes the projection",
            async () => {
                entityManager.query.mockResolvedValueOnce([{
                    user_id: "u-2"
                }]).mockResolvedValueOnce([{
                    user_id: "u-3"
                }])
                await expect(listener.derive({
                    topic: "prefix.enrollments", row: {
                        id: "en-1"
                    }
                })).resolves.toEqual(["u-2"])
                await expect(listener.derive({
                    topic: "prefix.courses", row: {
                        id: "course-1"
                    }
                })).resolves.toEqual(["u-3"])
                await listener.recompute("u-4")
                expect(projection.recompute).toHaveBeenCalledWith({
                    userId: "u-4"
                })
            })
    })
