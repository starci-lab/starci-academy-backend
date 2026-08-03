/**
 * Thrown when a subprocess is canceled via cancelSignal (or related execa cancel options).
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

export interface ExecaCommandCanceledExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    isGracefullyCanceled?: boolean
    stdout?: string
    stderr?: string
}

export class ExecaCommandCanceledException extends AbstractException {
    constructor(
        {
            command,
            args,
            isGracefullyCanceled,
            stdout,
            stderr,
            originalError,
        }: ExecaCommandCanceledExceptionMetadata
    ) {
        super(
            "Command was canceled",
            "EXECA_COMMAND_CANCELED_EXCEPTION",
            {
                command,
                args,
                isGracefullyCanceled,
                stdout,
                stderr,
                originalError,
            }
        )
    }
}
