/**
 * Config namespace `app` — environment variables in registerAs factory.
 */
import {
    registerAs,
} from "@nestjs/config"

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
        port: Number(process.env.PORT) || 3000,
    }),
)
