import {
    ProgressProjectionListener
} from "./progress-projection.listener"

describe("ProgressProjectionListener",
    () => {
        it("derives enrollment targets without a database lookup",
            async () => {
                const service = new ProgressProjectionListener({
                    query: jest.fn()
                } as never,
{
    recompute: jest.fn()
} as never,
{
} as never,
{
} as never)
                await expect((service as unknown as { deriveTargets(message: unknown): Promise<unknown> }).deriveTargets({
                    topic: "prefix.enrollments", row: {
                        user_id: "u", course_id: "c"
                    }
                })).resolves.toEqual([{
                    userId: "u", courseId: "c"
                }])
                await expect((service as unknown as { deriveTargets(message: unknown): Promise<unknown> }).deriveTargets({
                    topic: "prefix.unknown", row: {
                    }
                })).resolves.toEqual([])
            })
        it("skips user-content changes when the owning content is absent",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([])
                }
                const service = new ProgressProjectionListener(manager as never,
{
} as never,
{
} as never,
{
} as never)
                await expect((service as unknown as { deriveTargets(message: unknown): Promise<unknown> }).deriveTargets({
                    topic: "prefix.user_contents", row: {
                        user_id: "u", content_id: "content"
                    }
                })).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalled()
            })

        it("derives content, challenge, and milestone targets from parent lookups",
            async () => {
                const manager = {
                    query: jest.fn()
                        .mockResolvedValueOnce([{
                            course_id: "course-content"
                        }])
                        .mockResolvedValueOnce([{
                            user_id: "user-challenge", course_id: "course-challenge"
                        }])
                        .mockResolvedValueOnce([{
                            user_id: "user-milestone", course_id: "course-milestone"
                        }]),
                }
                const service = new ProgressProjectionListener(manager as never,
                    {
                        recompute: jest.fn(),
                    } as never,
                    {
                    } as never,
                    {
                    } as never)
                const deriveTargets = (message: unknown) => (service as unknown as {
                    deriveTargets(value: unknown): Promise<Array<unknown>>
                }).deriveTargets(message)

                await expect(deriveTargets({
                    topic: "prefix.user_contents", row: {
                        user_id: "user-content", content_id: "content",
                    },
                })).resolves.toEqual([{
                    userId: "user-content", courseId: "course-content",
                }])
                await expect(deriveTargets({
                    topic: "prefix.user_challenge_submission_attempts", row: {
                        user_challenge_submission_id: "submission",
                    },
                })).resolves.toEqual([{
                    userId: "user-challenge", courseId: "course-challenge",
                }])
                await expect(deriveTargets({
                    topic: "prefix.user_milestone_task_attempts", row: {
                        user_milestone_task_id: "task",
                    },
                })).resolves.toEqual([{
                    userId: "user-milestone", courseId: "course-milestone",
                }])
            })

        it("skips malformed parent rows and delegates derived recomputes",
            async () => {
                const recompute = jest.fn()
                const manager = {
                    query: jest.fn().mockResolvedValue([]),
                }
                const service = new ProgressProjectionListener(manager as never,
                    {
                        recompute,
                    } as never,
                    {
                    } as never,
                    {
                    } as never)
                const deriveTargets = (message: unknown) => (service as unknown as {
                    deriveTargets(value: unknown): Promise<Array<unknown>>
                }).deriveTargets(message)

                await expect(deriveTargets({
                    topic: "prefix.user_challenge_submission_attempts", row: {
                    },
                })).resolves.toEqual([])
                await expect(deriveTargets({
                    topic: "prefix.user_milestone_task_attempts", row: {
                        user_milestone_task_id: "missing",
                    },
                })).resolves.toEqual([])
                await expect(deriveTargets({
                    topic: "prefix.user_contents", row: {
                        user_id: "u", content_id: "missing",
                    },
                })).resolves.toEqual([])

                await (service as unknown as {
                    recomputeTarget(target: { userId: string; courseId: string }): Promise<void>
                }).recomputeTarget({
                    userId: "u", courseId: "c",
                })
                expect(recompute).toHaveBeenCalledWith({
                    userId: "u", courseId: "c",
                })
            })
    })
