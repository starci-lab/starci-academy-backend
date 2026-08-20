import os from "node:os"
import {
    CommandProbeService,
} from "./command-probe.service"
import {
    DeviceService,
} from "./device.service"

describe("DeviceService",
    () => {
        const probe = {
            run: jest.fn<Promise<string>, [string, Array<string>, number]>(),
        } as unknown as CommandProbeService

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("collects NVIDIA information and prefers it over the platform probe",
            async () => {
                probe.run = jest.fn()
                    .mockResolvedValueOnce("512, 8192, NVIDIA RTX 4090")
                const service = new DeviceService(probe)

                const info = await service.collect()

                expect(probe.run).toHaveBeenCalledWith(
                    "nvidia-smi",
                    [
                        "--query-gpu=memory.free,memory.total,name",
                        "--format=csv,noheader,nounits",
                    ],
                    3000,
                )
                expect(info).toMatchObject({
                    platform: os.platform(),
                    arch: os.arch(),
                    gpu: "NVIDIA RTX 4090",
                    vramFreeMb: 512,
                    vramTotalMb: 8192,
                })
                expect(probe.run).toHaveBeenCalledTimes(1)
            })

        it("falls back to a platform display probe when NVIDIA is unavailable",
            async () => {
                probe.run = jest.fn()
                    .mockRejectedValueOnce(new Error("nvidia-smi missing"))
                    .mockResolvedValueOnce("00:02.0 VGA compatible controller: Intel UHD Graphics")
                const service = new DeviceService(probe)

                const info = await service.collect()

                expect(info.gpu).toContain("Intel UHD Graphics")
                expect(info.vramFreeMb).toBeUndefined()
                expect(info.vramTotalMb).toBeUndefined()
                expect(probe.run).toHaveBeenCalledWith(expect.any(String),
                    expect.any(Array),
                    3000)
            })

        it("does not expose malformed NVIDIA fields and tolerates empty output",
            async () => {
                probe.run = jest.fn().mockResolvedValueOnce("not-a-row")
                const service = new DeviceService(probe)

                const info = await service.collect()

                expect(info.gpu).toBeNull()
                expect(info.vramFreeMb).toBeUndefined()
                expect(info.vramTotalMb).toBeUndefined()
                expect(probe.run).toHaveBeenCalled()
            })
    })
