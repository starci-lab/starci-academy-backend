/**
 * Thrown when a shell/command execution fails (execa stderr or non-zero exit).
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

/** Failed command + exit/stdio for a non-zero subprocess. */
export interface ExecaExecutionFailedExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    stderr: string
    stdout?: string
    exitCode?: number
}

/** Surfaces a subprocess failure so the pipeline stops instead of continuing on bad output. */
export class ExecaExecutionFailedException extends AbstractException {
    constructor(
        {
            command,
            args,
            stderr,
            stdout,
            exitCode,
            originalError,
        }: ExecaExecutionFailedExceptionMetadata
    ) {
        super(
            "Execution failed",
            "EXECA_EXECUTION_FAILED_EXCEPTION",
            {
                command,
                args,
                stderr,
                stdout,
                exitCode,
                originalError,
            }
        )
    }
}
