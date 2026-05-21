/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình Redis (khớp .kubernetes/redis.yaml).
 * (EN: Redis connection config (aligned with .kubernetes/redis.yaml).)
 */
export interface RedisConfig {
    host: string
    port: number
}

/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "redis-service",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
