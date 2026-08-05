/**
 * Thrown when exec parameters are invalid before spawning a subprocess.
 */

import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

/** Invalid execa invocation params that were rejected before spawn. */
export interface ExecaInvalidParamsExceptionMetadata extends AbstractExceptionMetadata {
    command: string
    args: Array<string>
    reason: string
}

/** Rejects a malformed execa call before spawn — prevents confusing OS errors. */
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
