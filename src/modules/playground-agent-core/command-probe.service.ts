import {
    Injectable 
} from "@nestjs/common"

@Injectable()
/**
 * Runs local CLI probes (docker, kubectl, nvidia-smi, wmic, ...) with NO shell --
 * best-effort, never throws. The one place the agents shell out for READ-ONLY
 * snapshots, injected via DI so every capability shares the same runner.
 *
 * Loads execa via dynamic `import()` (execa v9 is ESM-only) -- the same
 * ESM-safe idiom the backend already uses (see api/.../compile-cv-pdf). Unlike
 * the strict {@link ExecaService}, this is deliberately LENIENT: a probe that
 * writes to stderr but still prints useful stdout (docker/kubectl warnings)
 * must not be discarded -- only a throw (missing binary / non-zero / timeout)
 * yields "".
 */
export class CommandProbeService {
    /** Run a command (no shell); resolve its stdout ("" if the binary is missing or it errors/timeouts). */
    async run(file: string, args: Array<string> = [], timeoutMs = 8000): Promise<string> {
        try {
            const { execa } = await import("execa")
            // no shell; a positive timeout maps to execa's `timeout`. Throw (missing
            // binary / non-zero / timeout) is caught below -> "". stderr alone does NOT
            // throw, so stdout survives warning noise (lenient, unlike ExecaService).
            const options = timeoutMs > 0 ? {
                shell: false as const, timeout: timeoutMs 
            } : {
                shell: false as const 
            }
            const { stdout } = await execa(file,
                args,
                options)
            return typeof stdout === "string" ? stdout : ""
        } catch {
            return ""
        }
    }

    /** Non-empty, trimmed lines of a command's stdout. */
    lines(out: string): Array<string> {
        return out.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0)
    }
}
