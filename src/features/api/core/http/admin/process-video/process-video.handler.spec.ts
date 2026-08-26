import {
    ProcessVideoHandler
} from "./process-video.handler"

describe("ProcessVideoHandler",
    () => {
        it("creates and queues a job using the URL filename",
            async () => {
                const job = {
                    id: "job"
                }
                const actions = {
                    createJob: jest.fn().mockResolvedValue(job)
                }
                const queue = {
                    add: jest.fn().mockResolvedValue(undefined)
                }
                const superJson = {
                    stringify: jest.fn((value: unknown) => JSON.stringify(value))
                }
                const handler = new ProcessVideoHandler(actions as never,
{
} as never,
superJson as never,
queue as never,
{
    log: jest.fn()
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process({
                    params: {
                        url: "https://example.test/path/video.mp4"
                    }
                })).resolves.toEqual({
                    jobId: "job", message: "Video processing job enqueued successfully."
                })
                expect(actions.createJob).toHaveBeenCalledWith(expect.objectContaining({
                    id: expect.any(String), maxSteps: 5, payload: expect.any(String)
                }))
                expect(queue.add).toHaveBeenCalledWith("job",
                    expect.any(String),
                    {
                        jobId: "job"
                    })
            })
    })
