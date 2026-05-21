/**
 * Cấu hình namespace `database` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `database` — environment variables in registerAs factory.)
 */
import { registerAs } from "@nestjs/config"

export interface DatabaseConfig { host: string; port: number; username: string; password: string; database: string }
/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const databaseConfig = registerAs("database", (): DatabaseConfig => ({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
    database: process.env.POSTGRES_DB ?? "failover_service",
}))
