/**
 * Cấu hình namespace `redis` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `redis` — environment variables in registerAs factory.)
 */
import { registerAs } from "@nestjs/config"

export interface RedisConfig { host: string; port: number }
/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const redisConfig = registerAs("redis", (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
}))
