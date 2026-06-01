import type {
    ModelProvider,
} from "@modules/databases"

/**
 * Params for {@link AiPingService.pingKey}.
 */
export interface PingKeyParams {
    /** Provider whose zero-token endpoint will receive the ping. */
    provider: ModelProvider
    /** Raw API key value to authenticate the ping. */
    key: string
}

/**
 * Result of a provider ping — used by the AI Balancer health checker.
 */
export interface PingKeyResult {
    /** Whether the ping returned a healthy response. */
    success: boolean
    /** Provider error message captured on failure (truncated). */
    errorMessage: string | null
}
