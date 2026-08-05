import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    execSync,
} from "child_process"
import {
    platform,
} from "os"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    GpuVendor,
} from "./enums/gpu"
import type {
    GpuInfo,
} from "./types/gpu"

@Injectable()
/**
 * Service for detecting the dedicated GPU on the current machine.
 * Runs detection once at module init and caches the result.
 */
export class GpuService implements OnModuleInit {
    private _gpuInfo: GpuInfo = {
        vendor: GpuVendor.None,
        name: "Unknown",
        hwEncoder: null,
    }

    constructor(
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Get the detected GPU info.
     */
    get gpuInfo(): GpuInfo {
        return this._gpuInfo
    }

    onModuleInit(): void {
        this._gpuInfo = this.detectGpu()
        this.winstonService.log(WinstonLog.IntegrationCallSucceeded,
            {
                op: "integration.gpu.detected",
                meta: {
                    name: this._gpuInfo.name,
                    vendor: this._gpuInfo.vendor,
                    encoder: this._gpuInfo.hwEncoder ?? "software",
                },
            })
    }

    /**
     * Detect the dedicated GPU on the current machine.
     */
    private detectGpu(): GpuInfo {
        const os = platform()

        try {
            let gpuNames: Array<string> = []

            if (os === "win32") {
                // Windows: use PowerShell Get-CimInstance (WMIC is deprecated/removed)
                const output = execSync(
                    "powershell -NoProfile -Command \"Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name\"",
                    {
                        encoding: "utf8", timeout: 10000 
                    },
                )
                gpuNames = output
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
            } else if (os === "linux") {
                // Linux: use lspci
                const output = execSync(
                    "lspci | grep -i 'vga\\|3d\\|display'",
                    {
                        encoding: "utf8", timeout: 5000 
                    },
                )
                gpuNames = output
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
            } else if (os === "darwin") {
                // macOS: use system_profiler
                const output = execSync(
                    "system_profiler SPDisplaysDataType | grep 'Chipset Model'",
                    {
                        encoding: "utf8", timeout: 5000 
                    },
                )
                gpuNames = output
                    .split("\n")
                    .map((line) => line.replace("Chipset Model:",
                        "").trim())
                    .filter(Boolean)
            }

            // Find the dedicated GPU (prefer NVIDIA > AMD > Intel)
            const dedicatedGpu = this.pickDedicatedGpu(gpuNames)
            return dedicatedGpu
        } catch (error) {
            this.winstonService.log(WinstonLog.IntegrationCallFailed,
                {
                    op: "integration.gpu.detection-failed",
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                vendor: GpuVendor.None,
                name: "Detection failed",
                hwEncoder: null,
            }
        }
    }

    /**
     * Pick the dedicated GPU from a list of GPU names.
     * Priority: NVIDIA > AMD > Intel > None.
     */
    private pickDedicatedGpu(gpuNames: Array<string>): GpuInfo {
        const lower = gpuNames.map((n) => n.toLowerCase())

        // Check NVIDIA
        const nvidiaIdx = lower.findIndex((n) => n.includes("nvidia") || n.includes("geforce") || n.includes("quadro") || n.includes("rtx") || n.includes("gtx"))
        if (nvidiaIdx !== -1) {
            return {
                vendor: GpuVendor.Nvidia,
                name: gpuNames[nvidiaIdx],
                hwEncoder: "h264_nvenc",
            }
        }

        // Check AMD
        const amdIdx = lower.findIndex((n) => n.includes("amd") || n.includes("radeon") || n.includes("rx "))
        if (amdIdx !== -1) {
            return {
                vendor: GpuVendor.Amd,
                name: gpuNames[amdIdx],
                hwEncoder: "h264_amf",
            }
        }

        // Check Intel
        const intelIdx = lower.findIndex((n) => n.includes("intel") || n.includes("iris") || n.includes("uhd"))
        if (intelIdx !== -1) {
            return {
                vendor: GpuVendor.Intel,
                name: gpuNames[intelIdx],
                hwEncoder: "h264_qsv",
            }
        }

        return {
            vendor: GpuVendor.None,
            name: gpuNames[0] ?? "No GPU detected",
            hwEncoder: null,
        }
    }
}
