import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a personal-project branch name that fails the allowed-character pattern. */
export type PersonalProjectInvalidBranchNameExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a personal-project GitHub branch name contains characters
 * outside the allowed Git ref pattern.
 */
export class PersonalProjectInvalidBranchNameException extends AbstractException {
    constructor({
        originalError,
    }: PersonalProjectInvalidBranchNameExceptionMetadata) {
        super(
            "Invalid branch name.",
            "PERSONAL_PROJECT_INVALID_BRANCH_NAME_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
