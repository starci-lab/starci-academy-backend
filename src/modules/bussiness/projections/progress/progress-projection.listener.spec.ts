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
    })
