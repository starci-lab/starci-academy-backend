/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình app (cổng HTTP, tên pod K8s).
 * (EN: App config (HTTP port, K8s pod name).)
 */
export interface AppConfig {
    port: number
    podName: string
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
        podName: process.env.HOSTNAME ?? "local-machine",
    }),
)
