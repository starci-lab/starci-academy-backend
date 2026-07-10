import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a personal-project operation with no GitHub URL, request or stored. */
export type PersonalProjectGithubUrlMissingExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a personal-project GitHub operation (sync branch-only update,
 * or review) has neither a request `githubUrl` nor one already saved on the
 * enrollment.
 */
export class PersonalProjectGithubUrlMissingException extends AbstractException {
    constructor({
        originalError,
    }: PersonalProjectGithubUrlMissingExceptionMetadata) {
        super(
            "Provide a GitHub URL, or save one on your enrollment first.",
            "PERSONAL_PROJECT_GITHUB_URL_MISSING_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
