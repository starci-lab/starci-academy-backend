import {
    existsSync,
    readFileSync,
} from "fs"
import {
    join,
} from "path"
import {
    load as loadYaml,
} from "js-yaml"
import {
    envConfig
} from "@modules/env"
import type {
    AppConfig,
    SecretKeycloakAdmin,
} from "../types"

/**
 * Load the mounted `app.yaml` (parsed via `js-yaml`).
 *
 * Pass `appConfig` to short-circuit the read for tests / in-memory overrides.
 *
 * @param appConfig - optional pre-built config that skips the disk read
 * @returns Parsed {@link AppConfig}
 */
export const getAppConfig = (appConfig?: AppConfig): AppConfig => {
    if (!appConfig) {
        const raw = readFileSync(
            envConfig().mountPath.config.app,
            "utf8",
        )
        appConfig = loadYaml(raw) as AppConfig
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
 * Parse a mount key file into an array of trimmed, non-empty keys.
 *
 * File format (one key per line):
 * ```
 * # Comment lines starting with `#` are skipped (use them to note key owner / expiry).
 * sk-aaa
 * sk-bbb
 *
 * # Blank lines and surrounding whitespace are stripped.
 * sk-ccc
 * ```
 *
 * Used by the AI Balancer feature to load rotating-key pools per provider.
 * Missing or unreadable file returns an empty array — caller treats that
 * as "no key for this provider" without crashing boot.
 *
 * @param path - absolute path to the mount key list file
 * @returns Array of API keys; empty when file missing / empty / unreadable
 */
export const parseApiKeysFile = (path: string): Array<string> => {
    if (!existsSync(path)) {
        return []
    }
    try {
        const raw = readFileSync(
            path,
            "utf8",
        )
        // split on any line break, trim, drop blanks and `#`-comments
        return raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith("#"))
    } catch {
        return []
    }
}

/**
 * Get the OpenAI API-key pool from the mount keys file (newline-separated).
 * Empty array when the file is missing or empty.
 */
export const getOpenAiApiKeys = (): Array<string> => {
    return parseApiKeysFile(envConfig().mountPath.aiKeys.openai)
}

/**
 * Get the Gemini API-key pool from the mount keys file (newline-separated).
 * Empty array when the file is missing or empty.
 */
export const getGeminiApiKeys = (): Array<string> => {
    return parseApiKeysFile(envConfig().mountPath.aiKeys.gemini)
}

/**
 * Get the Anthropic Claude API-key pool from the mount keys file
 * (newline-separated). Empty array when the file is missing or empty.
 */
export const getClaudeApiKeys = (): Array<string> => {
    return parseApiKeysFile(envConfig().mountPath.aiKeys.claude)
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
 * Get admin API key (from terraform mount path).
 */
export const getAdminApiKey = (): string => {
    return readFileSync(
        join(
            process.cwd(),
            ".mount",
            "terraform",
            "admin-api-key.key",
        ),
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