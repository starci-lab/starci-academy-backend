/**
 * Config `registerAs` — chi doc `process.env` tai factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cau hinh app (cong HTTP).
 * (EN: App config (HTTP port).)
 */
export interface AppConfig {
    port: number
}

/**
 * Logic — Doc bien moi truong thanh object config typed.
 * Code — `registerAs` factory: `process.env.*` -> interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3000,
    }),
)
