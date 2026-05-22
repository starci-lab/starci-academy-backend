/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình replication PostgreSQL — master ghi, replica đọc.
 * (EN: PostgreSQL replication config — master writes, replica reads.)
 */
export interface PostgresConfig {
    master: {
        host: string
        port: number
        username: string
        password: string
        database: string
    }
    replica: {
        host: string
        port: number
        username: string
        password: string
        database: string
    }
}

/**
 * Cấu hình kết nối Postgres replication — namespace `postgres` cho ConfigService.
 * (EN: Postgres replication connection config — `postgres` namespace for ConfigService.)
 */
export const postgresConfig = registerAs(
    "postgres",
    (): PostgresConfig => ({
        master: {
            host: process.env.POSTGRES_MASTER_HOST ?? "localhost",
            port: Number(process.env.POSTGRES_MASTER_PORT) || 5432,
            username: process.env.POSTGRES_USER ?? "postgres",
            password: process.env.POSTGRES_PASSWORD ?? "Cuong123_A",
            database: process.env.POSTGRES_DB ?? "orders_db",
        },
        replica: {
            host: process.env.POSTGRES_REPLICA_HOST ?? "localhost",
            port: Number(process.env.POSTGRES_REPLICA_PORT) || 5433,
            username: process.env.POSTGRES_USER ?? "postgres",
            password: process.env.POSTGRES_PASSWORD ?? "Cuong123_A",
            database: process.env.POSTGRES_DB ?? "orders_db",
        },
    }),
)
