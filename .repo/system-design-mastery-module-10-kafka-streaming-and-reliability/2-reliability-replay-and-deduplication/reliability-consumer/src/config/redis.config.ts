/**
 * Config namespace `redis` — environment variables in registerAs factory.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Redis connection config.
 */
export interface RedisConfig {
    host: string
    port: number
}

/**
 * Logic: Map environment variables to typed config.
 * Code: `registerAs` factory reading `process.env.*`.
 */
export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
