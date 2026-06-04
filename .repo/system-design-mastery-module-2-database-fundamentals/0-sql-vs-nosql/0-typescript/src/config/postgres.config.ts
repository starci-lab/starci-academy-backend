/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * PostgreSQL connection config (TypeORM).
 */
export interface PostgresConfig {
    host: string
    port: number
    user: string
    password: string
    db: string
}

/**
 * Logic: Map PostgreSQL environment variables to typed config.
 * Code: `registerAs` factory reading `process.env.POSTGRES_*`.
 */
export const postgresConfig = registerAs(
    "postgres",
    (): PostgresConfig => ({
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        db: process.env.POSTGRES_DB || "sql_nosql_db",
    }),
)
