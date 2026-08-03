import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the generate tasks not array exception.
 */
export interface GenerateTasksNotArrayExceptionMetadata extends AbstractExceptionMetadata {
}

/**
 * Thrown when the parsed LLM output is valid JSON but not an array.
 */
export class GenerateTasksNotArrayException extends AbstractException {
    constructor({
        originalError,
    }: GenerateTasksNotArrayExceptionMetadata) {
        super(
            "Generated tasks payload is not an array",
            "GENERATE_TASKS_NOT_ARRAY_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
