import type {
    ModelProvider,
} from "@modules/databases"

/**
 * Params for `KeyHealthService.pingKey`.
 */
export interface PingKeyParams {
    /** Provider whose endpoint will receive the ping. */
    provider: ModelProvider
    /** Raw API key value to authenticate the ping. */
    key: string
}

/**
 * Result of `KeyHealthService.pingKey`.
 */
export interface PingKeyResult {
    /** Whether the ping returned a 2xx and parsed payload looked healthy. */
    success: boolean
    /** Provider error message captured on failure (truncated). */
    errorMessage: string | null
}
