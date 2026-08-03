import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a git-submission review whose repo loader got a 404. */
export interface GitRepositoryNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The repository URL that was loaded. */
    repoUrl: string
    /** The branch that was requested. */
    branch: string
}

/**
 * Thrown when the git-submission review's repo loader receives a 404 —
 * the repository does not exist, is private without a token that can see it,
 * or the branch name is wrong.
 */
export class GitRepositoryNotFoundException extends AbstractException {
    constructor({
        repoUrl,
        branch,
        originalError,
    }: GitRepositoryNotFoundExceptionMetadata) {
        super(
            "Repository not found. Check that it exists, is accessible, and the branch name is correct.",
            "GIT_REPOSITORY_NOT_FOUND_EXCEPTION",
            {
                repoUrl,
                branch,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
