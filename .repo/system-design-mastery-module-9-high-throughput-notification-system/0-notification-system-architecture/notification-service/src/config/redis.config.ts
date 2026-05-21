/**
 * Cấu hình namespace `redis` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `redis` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface RedisConfig {
    host: string
    port: number
}

/**
 * Cấu hình kết nối Redis — namespace `redis` cho ConfigService.
 * (EN: Redis connection config — `redis` namespace for ConfigService.)
 */
export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
