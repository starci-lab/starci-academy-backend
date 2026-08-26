import {
    ProcessVideoInitStepService
} from "./process-video-init-step.service"
import {
    VideoDownloadFailedException
} from "@modules/platform/exceptions/errors/video-encoder/video-download-failed"
describe("ProcessVideoInitStepService",
    () => { it("rejects an empty S3 object before persisting progress",
        async () => { const entityManager = {
            query: jest.fn(), transaction: jest.fn()
        }; const service = new ProcessVideoInitStepService({
            increaseJob: jest.fn(), saveExecutionResult: jest.fn()
        } as never,
{
    log: jest.fn()
} as never,
{
    buffer: jest.fn().mockResolvedValue(Buffer.alloc(0))
} as never,
entityManager as never); await expect(service.process({
    job: {
        id: "j1"
    }, payload: {
        assetId: "a1", url: "https://cdn.example/bucket/video.mp4", filename: "video.mp4", callbackQueries: {
        }
    }
} as never)).rejects.toThrow(VideoDownloadFailedException); expect(entityManager.transaction).not.toHaveBeenCalled() })

    it("rejects malformed source URLs before requesting an object",
        async () => {
            const buffer = jest.fn()
            const service = new ProcessVideoInitStepService({
                increaseJob: jest.fn(), saveExecutionResult: jest.fn(),
            } as never,
{
    log: jest.fn(),
} as never,
{
    buffer,
} as never,
{
    query: jest.fn(), transaction: jest.fn(),
} as never)

            await expect(service.process({
                job: {
                    id: "j1",
                },
                payload: {
                    assetId: "a1",
                    url: "not-a-url",
                    filename: "video.mp4",
                    callbackQueries: {
                    },
                },
            } as never)).rejects.toThrow()
            expect(buffer).not.toHaveBeenCalled()
        }) })
