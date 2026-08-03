import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GitHub authenticated-user profile response with no login. */
export type GithubProfileMissingLoginExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when GitHub's `/user` endpoint responds without a `login` field —
 * an unexpected shape for an authenticated request.
 */
export class GithubProfileMissingLoginException extends AbstractException {
    constructor({
        originalError,
    }: GithubProfileMissingLoginExceptionMetadata) {
        super(
            "GitHub profile is missing a login.",
            "GITHUB_PROFILE_MISSING_LOGIN_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_GATEWAY,
        )
    }
}
