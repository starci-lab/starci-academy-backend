/**
 * Cấu hình namespace `retry` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `retry` — environment variables in registerAs factory.)
 */
import { registerAs } from "@nestjs/config"

export interface RetryConfig {
    attempts: number
    delayMs: number
}

/**
 * Cấu hình retry — số lần thử lại và thời gian chờ cơ sở (exponential backoff).
 * (EN: Retry config — number of attempts and base delay (exponential backoff).)
 */
export const retryConfig = registerAs("retry", (): RetryConfig => ({
    attempts: Number(process.env.RETRY_ATTEMPTS) || 5,
    delayMs: Number(process.env.RETRY_DELAY_MS) || 1000,
}))
