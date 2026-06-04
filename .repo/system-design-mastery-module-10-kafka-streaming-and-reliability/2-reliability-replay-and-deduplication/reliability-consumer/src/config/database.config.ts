/**
 * Config namespace `database` — environment variables in registerAs factory.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Postgres/MySQL connection config.
 */
export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

/**
 * Logic: Map environment variables to typed config.
 * Code: `registerAs` factory reading `process.env.*`.
 */
export const databaseConfig = registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.POSTGRES_HOST ?? process.env.MYSQL_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT ?? process.env.MYSQL_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? process.env.MYSQL_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? process.env.MYSQL_DATABASE ?? "reliability_lab",
    }),
)
