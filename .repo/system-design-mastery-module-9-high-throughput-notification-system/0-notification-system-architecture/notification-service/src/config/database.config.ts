/**
 * Cấu hình namespace `database` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `database` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

/**
 * Cấu hình kết nối Postgres — namespace `database` cho ConfigService.
 * (EN: Postgres connection config — `database` namespace for ConfigService.)
 */
export const databaseConfig = registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? "notification_service",
    }),
)
