/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface CircuitBreakerConfig {
    timeoutMs: number
    errorThresholdPercentage: number
    resetTimeoutMs: number
}

/**
 * Cấu hình Circuit Breaker của API Gateway — namespace `circuitBreaker`.
 * (EN: API Gateway Circuit Breaker config — `circuitBreaker` namespace.)
 */
export const circuitBreakerConfig = registerAs(
    "circuitBreaker",
    (): CircuitBreakerConfig => ({
        timeoutMs: Number(process.env.CB_TIMEOUT_MS) || 2500,
        errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD_PERCENTAGE) || 50,
        resetTimeoutMs: Number(process.env.CB_RESET_TIMEOUT_MS) || 5000,
    }),
)
