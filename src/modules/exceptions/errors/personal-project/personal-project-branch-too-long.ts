import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a personal-project branch name exceeding the max length. */
export interface PersonalProjectBranchTooLongExceptionMetadata extends AbstractExceptionMetadata {
    /** The maximum allowed branch-name length. */
    max: number
}

/**
 * Thrown when a personal-project GitHub branch name exceeds `BRANCH_MAX`
 * characters.
 */
export class PersonalProjectBranchTooLongException extends AbstractException {
    constructor({
        max,
        originalError,
    }: PersonalProjectBranchTooLongExceptionMetadata) {
        super(
            "Branch name is too long.",
            "PERSONAL_PROJECT_BRANCH_TOO_LONG_EXCEPTION",
            {
                max,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
