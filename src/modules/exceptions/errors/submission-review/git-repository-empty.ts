import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a git-submission review whose repo loaded zero reviewable files. */
export interface GitRepositoryEmptyExceptionMetadata extends AbstractExceptionMetadata {
    /** The repository URL that was loaded. */
    repoUrl: string
    /** The branch that was requested. */
    branch: string
}

/**
 * Thrown when a git-submission review's repo loader succeeds but returns zero
 * documents — the repository (or branch) has nothing reviewable.
 */
export class GitRepositoryEmptyException extends AbstractException {
    constructor({
        repoUrl,
        branch,
        originalError,
    }: GitRepositoryEmptyExceptionMetadata) {
        super(
            "Repository is empty or contains no reviewable files.",
            "GIT_REPOSITORY_EMPTY_EXCEPTION",
            {
                repoUrl,
                branch,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
