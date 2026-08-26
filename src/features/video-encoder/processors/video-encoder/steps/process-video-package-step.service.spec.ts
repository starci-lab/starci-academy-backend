jest.mock("node:fs",
    () => {
        const actual = jest.requireActual("node:fs") as typeof import("node:fs")
        return {
            ...actual,
            promises: {
                ...actual.promises,
                access: jest.fn(),
            },
        }
    })

jest.mock("@modules/integrations/bento4/bento4.service",
    () => ({
        Bento4Service: jest.fn(),
    }))

jest.mock("@modules/integrations/ffmpeg/ffmpeg.service",
    () => ({
        FfmpegService: jest.fn(),
    }))

import {
    promises as fsPromise,
} from "node:fs"
import {
    ProcessVideoPackageStepService,
} from "./process-video-package-step.service"

describe("ProcessVideoPackageStepService",
    () => {
        const createSetup = () => {
            const increaseJob = jest.fn().mockResolvedValue(undefined)
            const saveExecutionResult = jest.fn().mockResolvedValue(undefined)
            const entityManager = {
                transaction: jest.fn(
                    async (callback: (manager: unknown) => Promise<void>) => callback({
                    }),
                ),
            }
            const bento4 = {
                checkFragments: jest.fn(),
                fragmentVideo: jest.fn().mockResolvedValue(undefined),
                generateMpegDashManifestFromFragments: jest.fn().mockResolvedValue(undefined),
            }
            const service = new ProcessVideoPackageStepService(
                {
                    increaseJob,
                    saveExecutionResult,
                } as never,
                {
                    log: jest.fn(),
                } as never,
                bento4 as never,
                {
                    videoNames: ["360p",
                        "720p"],
                } as never,
                entityManager as never,
            )
            return {
                service,
                bento4,
                entityManager,
                increaseJob,
                saveExecutionResult,
            }
        }

        const context = {
            payload: {
                assetId: "asset-1",
            },
            job: {
                id: "job-1",
            },
            extended: undefined,
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("fragments only required renditions, generates a manifest, and advances the job",
            async () => {
                const setup = createSetup()
                const access = fsPromise.access as jest.Mock
                access.mockRejectedValue(new Error("manifest absent"))
                setup.bento4.checkFragments
                    .mockResolvedValueOnce(true)
                    .mockResolvedValueOnce(false)

                await setup.service.process(context as never)

                expect(setup.bento4.checkFragments).toHaveBeenCalledTimes(2)
                expect(setup.bento4.fragmentVideo).toHaveBeenCalledWith(
                    expect.stringContaining("video-encoder-asset-1"),
                    "360p",
                )
                expect(setup.bento4.fragmentVideo).toHaveBeenCalledTimes(1)
                expect(setup.bento4.generateMpegDashManifestFromFragments).toHaveBeenCalledWith(
                    expect.stringContaining("video-encoder-asset-1"),
                    ["360p",
                        "720p"],
                )
                expect(setup.increaseJob).toHaveBeenCalledWith(expect.objectContaining({
                    job: context.job,
                }))
                expect(setup.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    key: "package",
                }))
            })

        it("uses the durable manifest as an idempotency marker",
            async () => {
                const setup = createSetup()
                const access = fsPromise.access as jest.Mock
                access.mockResolvedValue(undefined)

                await setup.service.process(context as never)

                expect(setup.bento4.checkFragments).not.toHaveBeenCalled()
                expect(setup.bento4.fragmentVideo).not.toHaveBeenCalled()
                expect(setup.bento4.generateMpegDashManifestFromFragments)
                    .not.toHaveBeenCalled()
                expect(setup.entityManager.transaction).toHaveBeenCalledTimes(1)
            })

        it("propagates packaging failures before committing job progress",
            async () => {
                const setup = createSetup()
                const failure = new Error("fragmentation failed")
                const access = fsPromise.access as jest.Mock
                access.mockRejectedValue(new Error("manifest absent"))
                setup.bento4.checkFragments.mockRejectedValueOnce(failure)

                await expect(setup.service.process(context as never)).rejects.toBe(failure)
                expect(setup.entityManager.transaction).not.toHaveBeenCalled()
            })
    })
