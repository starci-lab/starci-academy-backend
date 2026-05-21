/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface LoggingConfig {
    lokiUrl: string
    appName: string
    env: string
}

/**
 * Cấu hình logging transport (Loki labels + endpoint) — namespace `logging`.
 * (EN: Logging transport config (Loki labels + endpoint) — `logging` namespace.)
 */
export const loggingConfig = registerAs(
    "logging",
    (): LoggingConfig => ({
        lokiUrl: process.env.LOKI_URL ?? "http://loki:3100",
        appName: process.env.LOG_APP_NAME ?? "logging-api",
        env: process.env.LOG_ENV ?? "lab",
    }),
)
