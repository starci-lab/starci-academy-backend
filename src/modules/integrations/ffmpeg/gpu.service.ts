import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    execFileSync,
} from "child_process"
import {
    existsSync,
} from "fs"
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
    ExecaCommandNotFoundException,
} from "@modules/platform/exceptions/errors/execa/command-not-found"
import {
    GpuVendor,
} from "./enums/gpu"
import type {
    GpuInfo,
} from "./types/gpu"

/**
 * Absolute locations of the detection tool on each platform, most likely first.
 *
 * THE PATHS ARE ABSOLUTE ON PURPOSE. Detection used to shell out to bare
 * `powershell` / `lspci` / `system_profiler` names, which makes the resolved
 * binary a function of `PATH` -- and `PATH` is inherited, so anything that can
 * put a writeable directory in front of the real one decides what this service
 * executes at boot. Naming the file removes that lever entirely.
 *
 * Distros disagree on where `lspci` lives (merged-`/usr` moved it), so the Linux
 * entry is a short candidate list probed with `existsSync` rather than one path.
 */
const GPU_TOOL_CANDIDATES: Record<string, Array<string>> = {
    win32: [
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
    ],
    linux: [
        "/usr/bin/lspci",
        "/sbin/lspci",
        "/usr/sbin/lspci",
    ],
    darwin: [
        "/usr/sbin/system_profiler",
    ],
}

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
                const output = this.runGpuTool(
                    os,
                    [
                        "-NoProfile",
                        "-Command",
                        "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name",
                    ],
                    10000,
                )
                gpuNames = output
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
            } else if (os === "linux") {
                // Linux: use lspci. The display-adapter filter that used to be a
                // piped `grep` is done here instead -- one process, no shell.
                const output = this.runGpuTool(
                    os,
                    [],
                    5000,
                )
                gpuNames = output
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => /vga|3d|display/iu.test(line))
            } else if (os === "darwin") {
                // macOS: use system_profiler (same story -- filter in-process)
                const output = this.runGpuTool(
                    os,
                    [
                        "SPDisplaysDataType",
                    ],
                    5000,
                )
                gpuNames = output
                    .split("\n")
                    .filter((line) => line.includes("Chipset Model"))
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
     * Run the platform's detection tool from its ABSOLUTE path, with no shell.
     *
     * @param os - The `platform()` value the caller already resolved.
     * @param args - Arguments passed as a list (never concatenated into a command line).
     * @param timeoutMs - Wall-clock budget for the probe.
     * @returns The tool's stdout.
     * @throws When no candidate path exists -- detection then fails the same way a
     * missing binary always did, and {@link detectGpu}'s catch reports it.
     */
    private runGpuTool(
        os: string,
        args: Array<string>,
        timeoutMs: number,
    ): string {
        const candidates = GPU_TOOL_CANDIDATES[os] ?? []
        const binary = candidates.find((candidate) => existsSync(candidate))
        if (!binary) {
            throw new ExecaCommandNotFoundException({
                command: candidates.join(", ") || os,
                args,
            })
        }
        return execFileSync(
            binary,
            args,
            {
                encoding: "utf8",
                timeout: timeoutMs,
            },
        )
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
