import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a git-submission review whose repo loader got a 403. */
export interface GitRepositoryAccessDeniedExceptionMetadata extends AbstractExceptionMetadata {
    /** The repository URL that was loaded. */
    repoUrl: string
}

/**
 * Thrown when the git-submission review's repo loader receives a 403 — the
 * GitHub token lacks permission, or the rate limit was exceeded.
 */
export class GitRepositoryAccessDeniedException extends AbstractException {
    constructor({
        repoUrl,
        originalError,
    }: GitRepositoryAccessDeniedExceptionMetadata) {
        super(
            "Access denied to repository. Token may lack permission or the rate limit was exceeded.",
            "GIT_REPOSITORY_ACCESS_DENIED_EXCEPTION",
            {
                repoUrl,
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
