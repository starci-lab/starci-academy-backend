import ffmpeg from "fluent-ffmpeg"
import {
    FfmpegService
} from "./ffmpeg.service"
import {
    GpuVendor
} from "./enums/gpu"
jest.mock("fluent-ffmpeg",
    () => {
        const command = {
            videoCodec: jest.fn().mockReturnThis(), videoBitrate: jest.fn().mockReturnThis(), size: jest.fn().mockReturnThis(), audioCodec: jest.fn().mockReturnThis(), format: jest.fn().mockReturnThis(), audioBitrate: jest.fn().mockReturnThis(), audioFrequency: jest.fn().mockReturnThis(), audioChannels: jest.fn().mockReturnThis(), addOutputOptions: jest.fn().mockReturnThis(), save: jest.fn().mockReturnThis(), on: jest.fn(function(this: unknown, event: string, callback: () => void) { if (event === "end") callback(); return this })
        }
        const factory = jest.fn(() => command) as unknown as typeof ffmpeg
        factory.setFfmpegPath = jest.fn()
        return {
            __esModule: true, default: factory
        }
    })
describe("FfmpegService",
    () => {
        it("encodes all configured profiles with the selected hardware codec",
            async () => {
                const service = new FfmpegService({
                    gpuInfo: {
                        vendor: GpuVendor.Nvidia, hwEncoder: "h264_nvenc", name: "GPU"
                    }
                } as never,
{
    log: jest.fn()
} as never)
                await service.encodeAtMultipleBitrates("task",
                    "input.mp4")
                expect(ffmpeg).toHaveBeenCalledTimes(4)
            })
        it("falls back to software encoding when no hardware encoder exists",
            async () => {
                const service = new FfmpegService({
                    gpuInfo: {
                        vendor: GpuVendor.None, hwEncoder: undefined, name: "none"
                    }
                } as never,
{
    log: jest.fn()
} as never)
                await expect(service.encodeAtMultipleBitrates("task",
                    "input.mp4")).resolves.toBeUndefined()
            })
    })
