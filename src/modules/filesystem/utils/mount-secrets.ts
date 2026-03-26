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

/**
 * Get keycloak client secret (from mount path or provided value).
 */
export const getKeycloakClientSecret = (): string => {
    return readFileSync(envConfig().mountPath.terraform.keycloakClientSecret,
        "utf8")
}

/**
 * Get S3 secret access key (from mount path or provided value).
 */
export const getS3SecretAccessKey = (): string => {
    return readFileSync(envConfig().mountPath.terraform.s3SecretAccessKey,
        "utf8")
}
