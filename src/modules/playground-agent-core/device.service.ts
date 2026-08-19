import {
    Injectable 
} from "@nestjs/common"
import os from "node:os"
import {
    CommandProbeService 
} from "./command-probe.service"
import type {
    DeviceInfo,
    NvidiaVramInfo,
} from "./types"

@Injectable()
/** Collects the learner machine's hardware/OS snapshot (best-effort GPU). */
export class DeviceService {
    constructor(private readonly probe: CommandProbeService) {}

    /** Best-effort GPU name per platform (win: wmic/powershell, linux: lspci, mac: system_profiler). */
    private async detectGpu(): Promise<string | null> {
        try {
            if (process.platform === "win32") {
                const out = (await this.probe.run("wmic",
                    ["path",
                        "win32_VideoController",
                        "get",
                        "name"],
                    3000))
                    || (await this.probe.run("powershell",
                        ["-NoProfile",
                            "-Command",
                            "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"],
                        3000))
                const names = out.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== "name")
                const isVirtual = (n: string): boolean => /duet|parsec|virtual|basic display|rdp|citrix|idd|meta|spacedesk/i.test(n)
                return names.find((n) => !isVirtual(n)) ?? names[0] ?? null
            }
            if (process.platform === "linux") {
                const out = await this.probe.run("lspci",
                    [],
                    3000)
                const line = out.split(/\r?\n/).find((l) => /vga|3d|display/i.test(l))
                return line ? line.replace(/^.*:\s*/,
                    "").trim() : null
            }
            if (process.platform === "darwin") {
                const out = await this.probe.run("system_profiler",
                    ["SPDisplaysDataType"],
                    3000)
                const match = /Chipset Model:\s*(.+)/.exec(out)
                return match ? match[1].trim() : null
            }
        } catch {
            // best-effort -- a GPU we can't read is fine, the UI shows "--".
        }
        return null
    }

    /** NVIDIA-only VRAM + name via nvidia-smi. Returns {} if nvidia-smi is absent/fails. */
    private async detectNvidiaVram(): Promise<NvidiaVramInfo> {
        try {
            const out = await this.probe.run("nvidia-smi",
                ["--query-gpu=memory.free,memory.total,name",
                    "--format=csv,noheader,nounits"],
                3000)
            const first = out.split(/\r?\n/).map((s) => s.trim()).find((s) => s.length > 0)
            if (!first) {
                return {
                }
            }
            const [free,
                total,
                ...nameParts] = first.split(",").map((s) => s.trim())
            const vramFreeMb = Number.parseInt(free,
                10)
            const vramTotalMb = Number.parseInt(total,
                10)
            const name = nameParts.join(",").trim()
            return {
                vramFreeMb: Number.isFinite(vramFreeMb) ? vramFreeMb : undefined,
                vramTotalMb: Number.isFinite(vramTotalMb) ? vramTotalMb : undefined,
                gpu: name || undefined,
            }
        } catch {
            // best-effort -- no NVIDIA GPU (or driver) just means undefined vram.
            return {
            }
        }
    }

    /** Snapshot OS + CPU + RAM (from `os`) plus a best-effort GPU name + NVIDIA VRAM. */
    async collect(): Promise<DeviceInfo> {
        const cpus = os.cpus()
        const nvidia = await this.detectNvidiaVram()
        return {
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpuModel: cpus[0]?.model?.trim() ?? "Unknown",
            cpuCores: cpus.length,
            totalMemBytes: os.totalmem(),
            freeMemBytes: os.freemem(),
            gpu: nvidia.gpu ?? await this.detectGpu(),
            vramFreeMb: nvidia.vramFreeMb,
            vramTotalMb: nvidia.vramTotalMb,
        }
    }
}
