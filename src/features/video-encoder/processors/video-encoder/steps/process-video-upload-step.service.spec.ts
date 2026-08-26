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

        it("walks nested output and maps each supported artifact content type",
            async () => {
                const readdir = jest.spyOn(fsPromise,
                    "readdir")
                    .mockResolvedValueOnce([
                        {
                            name: "nested", isDirectory: () => true
                        },
                        {
                            name: "manifest.mpd", isDirectory: () => false
                        },
                        {
                            name: "audio-track.bin", isDirectory: () => false
                        },
                        {
                            name: "video-track.bin", isDirectory: () => false
                        },
                        {
                            name: "movie.mp4", isDirectory: () => false
                        },
                        {
                            name: "input.mp4", isDirectory: () => false
                        },
                    ] as never)
                    .mockResolvedValueOnce([
                        {
                            name: "segment.m4s", isDirectory: () => false
                        },
                    ] as never)
                const readFile = jest.spyOn(fsPromise,
                    "readFile")
                    .mockResolvedValue(Buffer.from("data"))
                const upload = jest.fn().mockResolvedValue(undefined)
                const action = {
                    increaseJob: jest.fn(), saveExecutionResult: jest.fn()
                }
                const transaction = jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback({
                }))
                const service = new ProcessVideoUploadStepService(action as never,
                {
                    log: jest.fn()
                } as never,
                {
                    buffer: upload
                } as never,
                {
                    transaction
                } as never)

                await service.process({
                    payload: {
                        assetId: "asset", filename: "input.mp4"
                    },
                    job: {
                        id: "job"
                    },
                } as never)

                expect(readFile).toHaveBeenCalledTimes(5)
                expect(upload).toHaveBeenCalledTimes(10)
                expect(upload).toHaveBeenCalledWith(expect.objectContaining({
                    name: "videos/asset/manifest.mpd",
                    contentType: "application/dash+xml",
                }))
                expect(upload).toHaveBeenCalledWith(expect.objectContaining({
                    name: "videos/asset/nested/segment.m4s",
                    contentType: "video/iso.segment",
                }))
                expect(upload).toHaveBeenCalledWith(expect.objectContaining({
                    contentType: "video/mp4"
                }))
                expect(upload).toHaveBeenCalledWith(expect.objectContaining({
                    contentType: "application/octet-stream"
                }))
                expect(action.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    executionResult: {
                        uploadCount: 5, s3BasePath: "videos/asset"
                    },
                }))
                readdir.mockRestore()
                readFile.mockRestore()
            })

        it("records zero uploads when only the source file is present",
            async () => {
                const readdir = jest.spyOn(fsPromise,
                    "readdir").mockResolvedValue([{
                        name: "input.mp4", isDirectory: () => false,
                    }] as never)
                const readFile = jest.spyOn(fsPromise,
                    "readFile")
                const upload = jest.fn()
                const action = {
                    increaseJob: jest.fn(), saveExecutionResult: jest.fn()
                }
                const service = new ProcessVideoUploadStepService(action as never,
                {
                    log: jest.fn()
                } as never,
                {
                    buffer: upload
                } as never,
                {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback({
                    }))
                } as never)

                await service.process({
                    payload: {
                        assetId: "asset", filename: "input.mp4"
                    },
                    job: {
                        id: "job"
                    },
                } as never)

                expect(readFile).not.toHaveBeenCalled()
                expect(upload).not.toHaveBeenCalled()
                expect(action.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    executionResult: {
                        uploadCount: 0, s3BasePath: "videos/asset"
                    },
                }))
                readdir.mockRestore()
            })

        it("propagates a directory failure without advancing the job",
            async () => {
                jest.spyOn(fsPromise,
                    "readdir").mockRejectedValue(new Error("missing output"))
                const action = {
                    increaseJob: jest.fn(), saveExecutionResult: jest.fn()
                }
                const service = new ProcessVideoUploadStepService(action as never,
                {
                    log: jest.fn()
                } as never,
                {
                    buffer: jest.fn()
                } as never,
                {
                    transaction: jest.fn()
                } as never)

                await expect(service.process({
                    payload: {
                        assetId: "asset", filename: "input.mp4"
                    },
                    job: {
                        id: "job"
                    },
                } as never)).rejects.toThrow("missing output")
                expect(action.increaseJob).not.toHaveBeenCalled()
                jest.restoreAllMocks()
            })
    })
