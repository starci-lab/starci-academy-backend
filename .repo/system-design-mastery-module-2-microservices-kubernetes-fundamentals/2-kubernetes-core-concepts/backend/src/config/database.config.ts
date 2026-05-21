/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình MySQL (khớp .kubernetes/mysql.yaml).
 * (EN: MySQL connection config (aligned with .kubernetes/mysql.yaml).)
 */
export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const databaseConfig = registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.MYSQL_HOST ?? "mysql-service",
        port: Number(process.env.MYSQL_PORT) || 3306,
        username: process.env.MYSQL_USER ?? "root",
        password: process.env.MYSQL_PASSWORD ?? "password",
        database: process.env.MYSQL_DATABASE ?? "test",
    }),
)
