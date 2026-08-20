jest.mock("node:child_process",
    () => ({
        execFileSync: jest.fn(),
    }))
jest.mock("node:fs",
    () => ({
        existsSync: jest.fn(),
    }))
jest.mock("node:os",
    () => ({
        ...jest.requireActual("node:os"),
        platform: jest.fn(),
    }))

import {
    execFileSync,
} from "node:child_process"
import {
    existsSync,
} from "node:fs"
import {
    platform,
} from "node:os"
import {
    GpuVendor,
} from "./enums/gpu"
import {
    GpuService,
} from "./gpu.service"

describe("GpuService",
    () => {
        const winstonService = {
            log: jest.fn(),
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("detects NVIDIA hardware on Linux and logs the successful probe",
            () => {
                jest.mocked(platform).mockReturnValue("linux")
                jest.mocked(existsSync).mockReturnValue(true)
                jest.mocked(execFileSync).mockReturnValue("01:00.0 VGA compatible controller: NVIDIA RTX 4090\n")
                const service = new GpuService(winstonService as never)

                service.onModuleInit()

                expect(service.gpuInfo).toEqual({
                    vendor: GpuVendor.Nvidia,
                    name: "01:00.0 VGA compatible controller: NVIDIA RTX 4090",
                    hwEncoder: "h264_nvenc",
                })
                expect(execFileSync).toHaveBeenCalledWith(
                    "/usr/bin/lspci",
                    [],
                    expect.objectContaining({
                        encoding: "utf8",
                        timeout: 5000,
                    }),
                )
                expect(winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        op: "integration.gpu.detected",
                        meta: expect.objectContaining({
                            vendor: GpuVendor.Nvidia,
                            encoder: "h264_nvenc",
                        }),
                    }),
                )
            })

        it("uses platform-specific output parsing for Windows and macOS",
            () => {
                const service = new GpuService(winstonService as never)
                jest.mocked(platform).mockReturnValue("win32")
                jest.mocked(existsSync).mockReturnValue(true)
                jest.mocked(execFileSync).mockReturnValue("Intel UHD Graphics 770\nAMD Radeon RX 7800\n")

                service.onModuleInit()

                expect(service.gpuInfo).toEqual({
                    vendor: GpuVendor.Amd,
                    name: "AMD Radeon RX 7800",
                    hwEncoder: "h264_amf",
                })
                expect(execFileSync).toHaveBeenCalledWith(
                    expect.stringContaining("powershell.exe"),
                    expect.arrayContaining(["-NoProfile"]),
                    expect.objectContaining({
                        timeout: 10000 
                    }),
                )

                jest.clearAllMocks()
                jest.mocked(platform).mockReturnValue("darwin")
                jest.mocked(execFileSync).mockReturnValue("Chipset Model: Apple M3\n")
                service.onModuleInit()

                expect(service.gpuInfo).toEqual({
                    vendor: GpuVendor.None,
                    name: "Apple M3",
                    hwEncoder: null,
                })
                expect(execFileSync).toHaveBeenCalledWith(
                    "/usr/sbin/system_profiler",
                    ["SPDisplaysDataType"],
                    expect.objectContaining({
                        timeout: 5000 
                    }),
                )
            })

        it("returns the first recognized Intel GPU and a none result for unknown platforms",
            () => {
                const service = new GpuService(winstonService as never)
                const pick = (service as unknown as {
            pickDedicatedGpu: (names: Array<string>) => unknown
        }).pickDedicatedGpu.bind(service)

                expect(pick(["Intel Iris Xe",
                    "Generic Display"])).toEqual({
                    vendor: GpuVendor.Intel,
                    name: "Intel Iris Xe",
                    hwEncoder: "h264_qsv",
                })
                expect(pick([])).toEqual({
                    vendor: GpuVendor.None,
                    name: "No GPU detected",
                    hwEncoder: null,
                })

                jest.mocked(platform).mockReturnValue("freebsd")
                service.onModuleInit()

                expect(service.gpuInfo).toEqual({
                    vendor: GpuVendor.None,
                    name: "No GPU detected",
                    hwEncoder: null,
                })
            })

        it("returns a failed detection result and failure log when no probe binary exists",
            () => {
                jest.mocked(platform).mockReturnValue("linux")
                jest.mocked(existsSync).mockReturnValue(false)
                const service = new GpuService(winstonService as never)

                service.onModuleInit()

                expect(service.gpuInfo).toEqual({
                    vendor: GpuVendor.None,
                    name: "Detection failed",
                    hwEncoder: null,
                })
                expect(winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        op: "integration.gpu.detection-failed",
                    }),
                )
            })
    })
