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
} from "node:fs"
import {
    pipeline,
} from "node:stream/promises"
import type {
    AssertValidExecParams,
    ExecErrorContext,
    ExecParams,
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
    ): Promise<string> {
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
                const mapped = this.mapKnownExecaError(err,
                    {
                        command,
                        args,
                        timeoutMs,
                    })
                if (mapped) {
                    throw mapped
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
     * Map an execa-specific failure to its typed domain exception -- shared by
     * {@link exec} and {@link execToFile} so both classify timeout / cancel /
     * command-not-found identically. `null` means the error is an `ExecaError`
     * this wrapper does not special-case; the caller falls back to a generic
     * {@link ExecaExecutionFailedException}.
     */
    private mapKnownExecaError(
        err: ExecaError,
        { command, args, timeoutMs }: ExecErrorContext,
    ): Error | null {
        if (err.timedOut) {
            return new ExecaCommandTimedOutException({
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
            return new ExecaCommandCanceledException({
                command,
                args,
                isGracefullyCanceled: err.isGracefullyCanceled,
                stdout: this.stringifyStdio(err.stdout),
                stderr: this.stringifyStdio(err.stderr),
                originalError: err,
            })
        }
        if (err.code === "ENOENT" || err.exitCode === 127) {
            return new ExecaCommandNotFoundException({
                command,
                args,
                nodeErrorCode: err.code,
                exitCode: err.exitCode,
                stderr: this.stringifyStdio(err.stderr),
                stdout: this.stringifyStdio(err.stdout),
                originalError: err,
            })
        }
        return null
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
                const mapped = this.mapKnownExecaError(error,
                    {
                        command,
                        args,
                        timeoutMs,
                    })
                if (mapped) {
                    throw mapped
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
