/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Redis connection config (aligned with .kubernetes/redis.yaml).
 */
export interface RedisConfig {
    host: string
    port: number
}

/**
 * Logic — Map environment variables to typed config.
 * Code — `registerAs` factory reading `process.env.*`.
 */
export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "redis-service",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
