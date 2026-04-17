import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when GitHub username cannot be found. */
export interface GithubUserNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    githubUsername: string
}

/** Thrown when GitHub username does not exist. */
export class GithubUserNotFoundException extends AbstractException {
    constructor(
        {
            githubUsername,
            originalError,
        }: GithubUserNotFoundExceptionMetadata,
    ) {
        super(
            "GitHub user not found",
            "GITHUB_USER_NOT_FOUND_EXCEPTION",
            {
                githubUsername,
                originalError,
            },
        )
    }
}

/** Metadata when GitHub username verification fails unexpectedly. */
export interface GithubUserVerificationFailedExceptionMetadata extends AbstractExceptionMetadata {
    githubUsername: string
}

/** Thrown when GitHub username verification fails for non-404 errors. */
export class GithubUserVerificationFailedException extends AbstractException {
    constructor(
        {
            githubUsername,
            originalError,
        }: GithubUserVerificationFailedExceptionMetadata,
    ) {
        super(
            "GitHub user verification failed",
            "GITHUB_USER_VERIFICATION_FAILED_EXCEPTION",
            {
                githubUsername,
                originalError,
            },
        )
    }
}
