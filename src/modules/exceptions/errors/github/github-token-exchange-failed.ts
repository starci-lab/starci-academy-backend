import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GitHub OAuth code exchange that returned no access token. */
export type GithubTokenExchangeFailedExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when GitHub's OAuth `access_token` endpoint responds without an
 * `access_token` field (bad code, revoked app, or a GitHub-side error).
 */
export class GithubTokenExchangeFailedException extends AbstractException {
    constructor({
        originalError,
    }: GithubTokenExchangeFailedExceptionMetadata) {
        super(
            "GitHub token exchange failed.",
            "GITHUB_TOKEN_EXCHANGE_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_GATEWAY,
        )
    }
}
