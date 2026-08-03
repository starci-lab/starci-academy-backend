/**
 * Thrown when exec parameters are invalid before spawning a subprocess.
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

export interface ExecaInvalidParamsExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    reason: string
}

export class ExecaInvalidParamsException extends AbstractException {
    constructor(
        {
            command,
            args,
            reason,
            originalError,
        }: ExecaInvalidParamsExceptionMetadata
    ) {
        super(
            "Invalid exec parameters",
            "EXECA_INVALID_PARAMS_EXCEPTION",
            {
                command,
                args,
                reason,
                originalError,
            }
        )
    }
}
