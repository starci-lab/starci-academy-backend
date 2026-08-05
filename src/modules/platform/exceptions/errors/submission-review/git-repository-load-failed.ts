import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a git-submission review whose repo loader failed for a non-404/403 reason. */
export interface GitRepositoryLoadFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** The repository URL that was loaded. */
    repoUrl: string
    /** The branch that was requested. */
    branch: string
}

/**
 * Thrown when the git-submission review's repo loader fails for a reason
 * other than not-found (404) or access-denied (403) -- a generic loader
 * failure (network, malformed repo, etc).
 */
export class GitRepositoryLoadFailedException extends AbstractException {
    constructor({
        repoUrl,
        branch,
        originalError,
    }: GitRepositoryLoadFailedExceptionMetadata) {
        super(
            "Failed to load repository.",
            "GIT_REPOSITORY_LOAD_FAILED_EXCEPTION",
            {
                repoUrl,
                branch,
                originalError,
            },
            HttpStatus.BAD_GATEWAY,
        )
    }
}
