import {
    Injectable
} from "@nestjs/common"
import {
    ExecaCommandCanceledException,
} from "@modules/platform/exceptions/errors/execa/canceled"
import {
    ExecaCommandNotFoundException,
} from "@modules/platform/exceptions/errors/execa/command-not-found"
import {
    ExecaExecutionFailedException,
} from "@modules/platform/exceptions/errors/execa/failed"
import {
    ExecaInvalidParamsException,
} from "@modules/platform/exceptions/errors/execa/invalid-params"
import {
    ExecaCommandTimedOutException,
} from "@modules/platform/exceptions/errors/execa/timed-out"
import {
    execa,
    ExecaError
} from "execa"
import {
    createWriteStream,
} from "fs"
import {
    pipeline,
} from "stream/promises"
import type {
    AssertValidExecParams,
    ExecParams,
    ExecResult,
    ExecToFileParams,
    ExecaUnknownProcessError,
} from "./types/exec"

@Injectable()
/**
 * Service to run shell commands via execa (no shell by default).
 *
 * @example
 * await execaService.exec({ command: "node", args: ["-v"] })
 */
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
        { command, args = [], timeoutMs, env }: ExecParams
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
                {
                    ...execaOptions,
                    env,
                }
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
     * Runs a command and streams stdout to a file. Avoids buffering stdout in memory.
     * Throws on non-zero exit, timeout, or any stderr output.
     */
    async execToFile(
        { command, args = [], timeoutMs, env, stdoutPath }: ExecToFileParams
    ): Promise<void> {
        this.assertValidExecParams({
            command,
            args,
            timeoutMs,
        })
        try {
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
                {
                    ...execaOptions,
                    env,
                    stdout: "pipe",
                    stderr: "pipe",
                },
            )

            const stderrChunks: Array<Buffer> = []
            subprocess.stderr?.on(
                "data",
                (chunk: Buffer) => stderrChunks.push(chunk),
            )

            await pipeline(
                subprocess.stdout!,
                createWriteStream(stdoutPath),
            )

            const { stderr } = await subprocess
            const stderrText = stderr
                ? String(stderr).trim()
                : Buffer.concat(stderrChunks).toString("utf8").trim()

            if (stderrText) {
                throw new ExecaExecutionFailedException({
                    command,
                    args,
                    stderr: stderrText,
                    stdout: "",
                })
            }
        } catch (error) {
            if (error instanceof ExecaExecutionFailedException) {
                throw error
            }

            if (error instanceof ExecaError) {
                if (error.timedOut) {
                    throw new ExecaCommandTimedOutException({
                        command,
                        args,
                        timeoutMs: typeof timeoutMs === "number" && timeoutMs > 0
                            ? timeoutMs
                            : 0,
                        stdout: this.stringifyStdio(error.stdout),
                        stderr: this.stringifyStdio(error.stderr),
                        originalError: error,
                    })
                }

                if (error.isCanceled) {
                    throw new ExecaCommandCanceledException({
                        command,
                        args,
                        isGracefullyCanceled: error.isGracefullyCanceled,
                        stdout: this.stringifyStdio(error.stdout),
                        stderr: this.stringifyStdio(error.stderr),
                        originalError: error,
                    })
                }

                if (error.code === "ENOENT" || error.exitCode === 127) {
                    throw new ExecaCommandNotFoundException({
                        command,
                        args,
                        nodeErrorCode: error.code,
                        exitCode: error.exitCode,
                        stderr: this.stringifyStdio(error.stderr),
                        stdout: this.stringifyStdio(error.stdout),
                        originalError: error,
                    })
                }
            }

            const execaErr = error as ExecaUnknownProcessError
            throw new ExecaExecutionFailedException({
                command,
                args,
                stderr: execaErr.stderr ?? "",
                stdout: execaErr.stdout,
                exitCode: execaErr.exitCode,
                originalError: error.originalError,
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

        if (!args.every((arg) => typeof arg === "string")) {
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
