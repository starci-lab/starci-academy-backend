/**
 * Thrown when the executable cannot be spawned (e.g. ENOENT) or is otherwise not found.
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

/** Missing binary name + args so PATH/install issues are obvious. */
export interface ExecaCommandNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    nodeErrorCode?: string
    exitCode?: number
    stderr?: string
    stdout?: string
}

/**
 * Fails fast when the executable is not on PATH -- retrying the same command cannot
 * succeed.
 */
export class ExecaCommandNotFoundException extends AbstractException {
    constructor(
        {
            command,
            args,
            nodeErrorCode,
            exitCode,
            stderr,
            stdout,
            originalError,
        }: ExecaCommandNotFoundExceptionMetadata
    ) {
        super(
            "Command not found or failed to spawn",
            "EXECA_COMMAND_NOT_FOUND_EXCEPTION",
            {
                command,
                args,
                nodeErrorCode,
                exitCode,
                stderr,
                stdout,
                originalError,
            }
        )
    }
}
