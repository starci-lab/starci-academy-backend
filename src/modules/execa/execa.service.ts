import {
    Injectable
} from "@nestjs/common"
import {
    ExecaCommandCanceledException,
    ExecaCommandNotFoundException,
    ExecaCommandTimedOutException,
    ExecaExecutionFailedException,
    ExecaInvalidParamsException,
} from "@modules/exceptions"
import {
    execa,
    ExecaError
} from "execa"
import type {
    AssertValidExecParams,
    ExecParams,
    ExecResult,
    ExecaUnknownProcessError
} from "./types"

/**
 * Service to run shell commands via execa (no shell by default).
 *
 * @example
 * await execaService.exec({ command: "node", args: ["-v"] })
 */
@Injectable()
export class ExecaService {
    /**
     * Runs a command and returns stdout. Throws if stderr is non-empty or the process fails.
     *
     * @param param - Command, optional args, optional timeout in milliseconds
     * @returns Raw stdout string from the subprocess
     *
     * @example
     * const version = await execaService.exec({ command: "node", args: ["-e", "process.stdout.write('ok')"] })
     */
    async exec(
        { command, args = [], timeoutMs }: ExecParams
    ): Promise<ExecResult> {
        // reject invalid input before touching the filesystem or spawning
        this.assertValidExecParams({
            command,
            args,
            timeoutMs,
        })

        try {
            // keep shell disabled; optional timeout maps to execa `timeout`
            const execaOptions =
                typeof timeoutMs === "number" && timeoutMs > 0
                    ? {
                        shell: false as const,
                        timeout: timeoutMs,
                    }
                    : {
                        shell: false as const,
                    }

            const subprocess = execa(
                command,
                args,
                execaOptions
            )
            const { stdout, stderr } = await subprocess

            // treat any stderr as failure for this wrapper contract
            if (stderr) {
                throw new ExecaExecutionFailedException({
                    command,
                    args,
                    stderr,
                    stdout,
                })
            }

            return stdout
        } catch (err: unknown) {
            // preserve our own failure from the success-path stderr check
            if (err instanceof ExecaExecutionFailedException) {
                throw err
            }

            if (err instanceof ExecaError) {
                // map execa-specific outcomes to typed domain exceptions
                if (err.timedOut) {
                    throw new ExecaCommandTimedOutException({
                        command,
                        args,
                        timeoutMs: typeof timeoutMs === "number" && timeoutMs > 0
                            ? timeoutMs
                            : 0,
                        stdout: this.stringifyStdio(err.stdout),
                        stderr: this.stringifyStdio(err.stderr),
                        originalError: err,
                    })
                }

                if (err.isCanceled) {
                    throw new ExecaCommandCanceledException({
                        command,
                        args,
                        isGracefullyCanceled: err.isGracefullyCanceled,
                        stdout: this.stringifyStdio(err.stdout),
                        stderr: this.stringifyStdio(err.stderr),
                        originalError: err,
                    })
                }

                if (err.code === "ENOENT") {
                    throw new ExecaCommandNotFoundException({
                        command,
                        args,
                        nodeErrorCode: err.code,
                        exitCode: err.exitCode,
                        stderr: this.stringifyStdio(err.stderr),
                        stdout: this.stringifyStdio(err.stdout),
                        originalError: err,
                    })
                }

                if (err.exitCode === 127) {
                    throw new ExecaCommandNotFoundException({
                        command,
                        args,
                        nodeErrorCode: err.code,
                        exitCode: err.exitCode,
                        stderr: this.stringifyStdio(err.stderr),
                        stdout: this.stringifyStdio(err.stdout),
                        originalError: err,
                    })
                }
            }

            // generic failure path for non-execa errors or unclassified ExecaError
            const execaErr = err as ExecaUnknownProcessError
            throw new ExecaExecutionFailedException({
                command,
                args,
                stderr: execaErr.stderr ?? String(err),
                stdout: execaErr.stdout,
                exitCode: execaErr.exitCode,
                originalError: err instanceof Error
                    ? err
                    : undefined,
            })
        }
    }

    /**
     * Validates exec parameters before spawn.
     *
     * @param param - Command, args, and optional timeout
     */
    private assertValidExecParams(
        { command, args, timeoutMs }: AssertValidExecParams
    ): void {
        if (typeof command !== "string" || command.trim().length === 0) {
            throw new ExecaInvalidParamsException({
                command: typeof command === "string"
                    ? command
                    : "",
                args,
                reason: "Command must be a non-empty string.",
            })
        }

        if (!Array.isArray(args)) {
            throw new ExecaInvalidParamsException({
                command,
                args: [],
                reason: "Args must be an array.",
            })
        }

        if (!args.every((a) => typeof a === "string")) {
            throw new ExecaInvalidParamsException({
                command,
                args,
                reason: "Every argument must be a string.",
            })
        }

        if (typeof timeoutMs === "number" && timeoutMs < 0) {
            throw new ExecaInvalidParamsException({
                command,
                args,
                reason: "timeoutMs must be non-negative when provided.",
            })
        }
    }

    /** Normalizes execa stdio fields that may be string or buffered/transform output. */
    private stringifyStdio(
        value: unknown
    ): string | undefined {
        return typeof value === "string"
            ? value
            : undefined
    }
}
