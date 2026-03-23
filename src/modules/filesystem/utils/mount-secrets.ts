import {
    readFileSync
} from "fs"
import {
    envConfig
} from "@modules/env"
import type {
    AppConfig,
} from "../types"

/**
 * Get app config (from mount path or provided value).
 */
export const getAppConfig = (appConfig?: AppConfig): AppConfig => {
    if (!appConfig) {
        appConfig = JSON.parse(
            readFileSync(envConfig().mountPath.config.app,
                "utf8"),
        ) as AppConfig
    }
    return appConfig
}