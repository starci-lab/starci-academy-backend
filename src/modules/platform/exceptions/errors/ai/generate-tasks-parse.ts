import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the generate tasks parse exception.
 */
export interface GenerateTasksParseExceptionMetadata extends AbstractExceptionMetadata {
    /**
     * The raw text snippet from the model output.
     */
    text?: string
}

/**
 * Thrown when the LLM output cannot be parsed as valid JSON array
 * (e.g. missing [ ] delimiters).
 */
export class GenerateTasksParseException extends AbstractException {
    constructor({
        text,
        originalError,
    }: GenerateTasksParseExceptionMetadata) {
        super(
            "Failed to parse task generation result — could not locate JSON array in model output",
            "GENERATE_TASKS_PARSE_EXCEPTION",
            {
                text,
                originalError,
            },
        )
    }
}
