import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a request missing the `x-admin-api-key` header. */
export type AdminApiKeyRequiredExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the admin API key guard (REST or GraphQL) receives no
 * `x-admin-api-key` header at all.
 */
export class AdminApiKeyRequiredException extends AbstractException {
    constructor({
        originalError,
    }: AdminApiKeyRequiredExceptionMetadata) {
        super(
            "x-admin-api-key header is required.",
            "ADMIN_API_KEY_REQUIRED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
