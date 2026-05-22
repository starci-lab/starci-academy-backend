/**
 * Config `registerAs` — chi doc `process.env` tai factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cau hinh ket noi PostgreSQL (TypeORM).
 * (EN: PostgreSQL connection config (TypeORM).)
 */
export interface PostgresConfig {
    host: string
    port: number
    user: string
    password: string
    db: string
}

/**
 * Logic — Doc bien moi truong PostgreSQL thanh object config typed.
 * Code — `registerAs` factory: `process.env.POSTGRES_*` -> interface config.
 * (EN Logic: Map PostgreSQL environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.POSTGRES_*`.)
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
