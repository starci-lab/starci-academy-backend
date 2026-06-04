/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * App config (HTTP port).
 */
export interface AppConfig {
    port: number
}

/**
 * Logic: Map environment variables to typed config.
 * Code: `registerAs` factory reading `process.env.*`.
 */
export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3001,
    }),
)
