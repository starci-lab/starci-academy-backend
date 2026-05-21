/**
 * Cấu hình namespace `rate-limit` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `rate-limit` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface RateLimitConfig {
    /** Số request tối đa trong cửa sổ thời gian. (EN: Max requests within time window.) */
    max: number
    /** Kích thước cửa sổ (giây). (EN: Window size in seconds.) */
    windowSeconds: number
}

/**
 * Cấu hình Rate Limiting — namespace `rateLimit` cho ConfigService.
 * (EN: Rate Limiting config — `rateLimit` namespace for ConfigService.)
 */
export const rateLimitConfig = registerAs("rateLimit", (): RateLimitConfig => ({
    max: Number(process.env.RATE_LIMIT_MAX) || 5,
    windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60,
}))
