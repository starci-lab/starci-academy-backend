import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a missing coding problem lookup. */
export interface CodingProblemNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The slug or id that did not resolve to an enabled problem. */
    identifier: string
}

/**
 * Thrown when a coding problem cannot be found (or is disabled) for the given
 * slug/id — e.g. a submit targets a problem that does not exist.
 */
export class CodingProblemNotFoundException extends AbstractException {
    constructor({
        identifier,
        originalError,
    }: CodingProblemNotFoundExceptionMetadata) {
        super(
            `Coding problem "${identifier}" was not found.`,
            "CODING_PROBLEM_NOT_FOUND_EXCEPTION",
            {
                identifier,
                originalError,
            },
        )
    }
}
