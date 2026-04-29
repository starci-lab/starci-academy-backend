import {
    existsSync,
    readFileSync,
} from "fs"
import {
    envConfig
} from "@modules/env"
import type {
    AppConfig,
    SecretKeycloakAdmin,
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
 * Get AES encryption key (from terraform mount path).
 */
export const getEncryptionKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.encryptionKey,
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

/**
 * Get github secret key (from terraform mount path).
 */
export const getGithubSecretKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.githubSecretKey,
        "utf8",
    )
}

/**
 * Get Sepay API key (from terraform mount path).
 */
export const getSepayApiKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.sepayApiKey,
        "utf8",
    )
}

/**
 * Get Brevo SMTP password/API key (from terraform mount path).
 */
export const getBrevoSmtpPassword = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.brevoSmtpPassword,
        "utf8",
    )
}

/**
 * Service account credentials for Google APIs (google-auth-library / googleapis).
 * Precedence: {@link envConfig.googleapis.serviceAccountJson} (full JSON string) then mount file
 * {@link envConfig.mountPath.terraform.gcpServiceAccountJson}. If neither is usable, returns undefined (ADC / GOOGLE_APPLICATION_CREDENTIALS).
 */
export const getGcpServiceAccountCredentials = ():
    | Record<string, unknown>
    | undefined => {
    const path = envConfig().mountPath.terraform.gcpServiceAccountJson
    if (!existsSync(path)) {
        return undefined
    }
    try {
        return JSON.parse(readFileSync(path,
            "utf8")) as Record<string, unknown>
    } catch {
        return undefined
    }
}

/**
 * Get keycloak admin credentials from mount path.
 */
export const getKeycloakAdmin = (): SecretKeycloakAdmin => {
    return JSON.parse(
        readFileSync(
            envConfig().mountPath.terraform.keycloakAdmin,
            "utf8"
        ),
    ) as SecretKeycloakAdmin
}