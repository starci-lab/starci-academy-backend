/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình kết nối PostgreSQL.
 * (EN: PostgreSQL connection config.)
 */
export interface PostgresConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

/**
 * Cấu hình kết nối Postgres — namespace `postgres` cho ConfigService.
 * (EN: Postgres connection config — `postgres` namespace for ConfigService.)
 */
export const postgresConfig = registerAs(
    "postgres",
    (): PostgresConfig => ({
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? "indexing_db",
    }),
)
