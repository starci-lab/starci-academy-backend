import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the no-active-balancer-key exception.
 */
export interface NoActiveBalancerKeyExceptionMetadata extends AbstractExceptionMetadata {
    /** Provider whose pool was empty / fully disabled. */
    provider: string
    /** Total keys (any status) the balancer has seen for the provider. */
    totalKeysCount: number
}

/**
 * Thrown by the AI Balancer when no active API key is available for a provider.
 *
 * Causes: empty mount file, every key disabled by the health service, or a
 * cold-start race where the store has not finished loading.
 */
export class NoActiveBalancerKeyException extends AbstractException {
    constructor({
        provider,
        totalKeysCount,
        originalError,
    }: NoActiveBalancerKeyExceptionMetadata) {
        super(
            `AI Balancer: no active key for provider "${provider}" (${totalKeysCount} total in pool)`,
            "NO_ACTIVE_BALANCER_KEY_EXCEPTION",
            {
                provider,
                totalKeysCount,
                originalError,
            },
        )
    }
}
