import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Thrown when a required request parameter is missing.
 */
export interface MissingRequiredParameterExceptionMetadata
  extends AbstractExceptionMetadata {
  parameter: string
}

/**
 * Thrown when a required request parameter is missing.
 */
export class MissingRequiredParameterException extends AbstractException {
    constructor(
        {
            parameter,
            originalError,
        }: MissingRequiredParameterExceptionMetadata,
    ) {
        super(
            `Missing required parameter: ${parameter}`,
            "MISSING_REQUIRED_PARAMETER_EXCEPTION",
            {
                parameter,
                originalError,
            },
        )
    }
}

