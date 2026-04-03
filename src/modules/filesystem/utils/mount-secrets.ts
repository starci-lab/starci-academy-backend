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
 * Get S3 secret access key (from mount path or provided value).
 */
export const getS3SecretAccessKey = (): string => {
    return readFileSync(envConfig().mountPath.terraform.s3SecretAccessKey,
        "utf8")
}

/**
 * Get PayOS API key (from terraform mount path).
 */
export const getPayosApiKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.payosApiKey,
        "utf8",
    )
}

/**
 * Get Gemini API key (from terraform mount path).
 */
export const getGeminiApiKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.geminiApiKey,
        "utf8",
    )
}

/**
 * Get OpenAI API key (from terraform mount path).
 */
export const getOpenAiApiKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.openAiApiKey,
        "utf8",
    )
}

/**
 * Get keycloak client secret (from terraform mount path).
 */
export const getKeycloakClientSecret = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.keycloakClientSecret,
        "utf8",
    )
}

/**
 * Get github access token (from terraform mount path).
 */
export const getGithubAccessToken = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.githubAccessToken,
        "utf8",
    )
}