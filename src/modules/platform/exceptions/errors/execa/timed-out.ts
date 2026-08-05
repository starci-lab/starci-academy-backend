/**
 * Thrown when a subprocess exceeds the configured timeout (execa `timeout` option).
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

/** Timed-out command + args/stdio. */
export interface ExecaCommandTimedOutExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    timeoutMs: number
    stdout?: string
    stderr?: string
}

/**
 * Aborts after the subprocess exceeded its timeout -- hung tools must not block the worker
 * forever.
 */
export class ExecaCommandTimedOutException extends AbstractException {
    constructor(
        {
            command,
            args,
            timeoutMs,
            stdout,
            stderr,
            originalError,
        }: ExecaCommandTimedOutExceptionMetadata
    ) {
        super(
            "Command timed out",
            "EXECA_COMMAND_TIMED_OUT_EXCEPTION",
            {
                command,
                args,
                timeoutMs,
                stdout,
                stderr,
                originalError,
            }
        )
    }
}
