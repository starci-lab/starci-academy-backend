import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `syncPersonalProjectGithub` call with no field to update. */
export type PersonalProjectGithubSyncInputMissingExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `syncPersonalProjectGithub` is called with none of
 * `githubUrl`/`branch`/`githubToken`/`clearGithubToken` set — nothing to sync.
 */
export class PersonalProjectGithubSyncInputMissingException extends AbstractException {
    constructor({
        originalError,
    }: PersonalProjectGithubSyncInputMissingExceptionMetadata) {
        super(
            "Provide githubUrl, branch, githubToken, or clearGithubToken.",
            "PERSONAL_PROJECT_GITHUB_SYNC_INPUT_MISSING_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
