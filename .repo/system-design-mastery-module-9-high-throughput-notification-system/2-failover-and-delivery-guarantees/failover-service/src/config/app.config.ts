/**
 * Cấu hình namespace `app` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `app` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình app (cổng HTTP).
 * (EN: App config (HTTP port).)
 */
export interface AppConfig {
    port: number
}

/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3000,
    }),
)
