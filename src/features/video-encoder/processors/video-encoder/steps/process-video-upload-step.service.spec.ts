import {
    ProcessVideoUploadStepService
} from "./process-video-upload-step.service"
import {
    promises as fsPromise
} from "node:fs"

describe("ProcessVideoUploadStepService",
    () => {
        it("uploads DASH files to both providers and advances the job",
            async () => {
                const readdir = jest.spyOn(fsPromise,
                    "readdir").mockResolvedValue([{
                        name: "manifest.mpd", isDirectory: () => false
                    } as never])
                const readFile = jest.spyOn(fsPromise,
                    "readFile").mockResolvedValue(Buffer.from("data"))
                const upload = jest.fn().mockResolvedValue(undefined)
                const action = {
                    increaseJob: jest.fn(), saveExecutionResult: jest.fn()
                }
                const manager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback({
                    }))
                }
                const service = new ProcessVideoUploadStepService(action as never,
{
    log: jest.fn()
} as never,
{
    buffer: upload
} as never,
manager as never)
                await service.process({
                    payload: {
                        assetId: "asset", filename: "input.mp4"
                    }, job: {
                        id: "job"
                    }
                } as never)
                expect(upload).toHaveBeenCalledTimes(2)
                expect(action.increaseJob).toHaveBeenCalled()
                readdir.mockRestore()
                readFile.mockRestore()
            })
    })
