import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the generate tasks missing context exception.
 */
export interface GenerateTasksMissingContextExceptionMetadata extends AbstractExceptionMetadata {
    /**
     * Which context field is missing (e.g. "requirements", "templates", "ideaText", "courseTitle").
     */
    field: string
}

/**
 * Thrown when a required context field for task generation is missing or null.
 */
export class GenerateTasksMissingContextException extends AbstractException {
    constructor({
        field,
        originalError,
    }: GenerateTasksMissingContextExceptionMetadata) {
        super(
            `Cannot generate tasks — required context field "${field}" is missing or empty`,
            "GENERATE_TASKS_MISSING_CONTEXT_EXCEPTION",
            {
                field,
                originalError,
            },
        )
    }
}
