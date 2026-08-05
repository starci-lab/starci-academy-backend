import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the unsupported-ai-provider exception.
 */
export interface UnsupportedAiProviderExceptionMetadata extends AbstractExceptionMetadata {
    /** Raw provider value that hit a branch not implemented in the caller. */
    provider: string
}

/**
 * Thrown when AI-Balancer code encounters a `ModelProvider` enum value that
 * has no concrete branch -- either because a new provider was added to the
 * enum without wiring the consumer side, or because the catalog/config
 * carries an unknown string value.
 *
 * Use this instead of a bare `new Error("Unsupported provider: ...")` so the
 * exception surfaces in Sentry/logs with a stable `code` and structured
 * metadata.
 */
export class UnsupportedAiProviderException extends AbstractException {
    constructor({
        provider,
        originalError,
    }: UnsupportedAiProviderExceptionMetadata) {
        super(
            `Unsupported AI provider: "${provider}"`,
            "UNSUPPORTED_AI_PROVIDER_EXCEPTION",
            {
                provider,
                originalError,
            },
        )
    }
}
