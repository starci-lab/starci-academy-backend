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
let runtimeAppConfig: AppConfig | undefined

/**
 * Replace the in-memory app catalog after init merges mount data
 * (`.mount/data/ai-models`, `.mount/data/subcriptions`) into `app.yaml`.
 */
export const setRuntimeAppConfig = (appConfig: AppConfig): void => {
    runtimeAppConfig = appConfig
}

/** Clear the runtime override (tests). */
export const clearRuntimeAppConfig = (): void => {
    runtimeAppConfig = undefined
}

export const getAppConfig = (appConfig?: AppConfig): AppConfig => {
    if (appConfig) {
        return appConfig
    }
    if (runtimeAppConfig) {
        return runtimeAppConfig
    }
    const raw = readFileSync(
        envConfig().mountPath.config.app,
        "utf8",
    )
    return loadYaml(raw) as AppConfig
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
 * Get the OpenRouter API-key pool from the mount keys file (newline-separated).
 * Empty array when the file is missing or empty.
 */
export const getOpenRouterApiKeys = (): Array<string> => {
    return parseApiKeysFile(envConfig().mountPath.aiKeys.openrouter)
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
 * Get the data-git token used to pull the private content repo.
 *
 * Optional dedicated read-only token: when its mount file is absent, fall back
 * to the shared github access token so existing deployments keep working.
 */
export const getDataGitToken = (): string => {
    const path = envConfig().mountPath.terraform.dataGitToken
    // no dedicated token mounted → reuse the shared github access token
    if (!existsSync(path)) {
        return getGithubAccessToken().trim()
    }
    // trim trailing newline so the token is usable as an HTTP credential
    return readFileSync(path,
        "utf8").trim()
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
 * Get the Judge0 `X-Auth-Token` (from terraform mount path).
 *
 * Optional: Judge0 can run without authentication, so a missing file is not an
 * error — an empty string means "no token", and the client simply omits the
 * header. Trimmed to drop any trailing newline added by editors.
 *
 * @returns The Judge0 auth token, or `""` when the mount file is absent.
 */
export const getJudge0AuthToken = (): string => {
    // resolve the configured mount path for the token file
    const path = envConfig().mountPath.terraform.judge0AuthToken
    // treat an absent file as "auth disabled" rather than throwing on boot
    if (!existsSync(path)) {
        return ""
    }
    // read + trim so a trailing newline does not corrupt the header value
    return readFileSync(path,
        "utf8").trim()
}

/**
 * Get Stripe secret API key (from terraform mount path).
 */
export const getStripeSecretKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.stripeSecretKey,
        "utf8",
    )
}

/**
 * Get Stripe webhook signing secret (from terraform mount path).
 */
export const getStripeWebhookSecret = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.stripeWebhookSecret,
        "utf8",
    )
}

/**
 * Get PayPal REST app client id (from terraform mount path).
 */
export const getPaypalClientId = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.paypalClientId,
        "utf8",
    )
}

/**
 * Get PayPal REST app client secret (from terraform mount path).
 */
export const getPaypalClientSecret = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.paypalClientSecret,
        "utf8",
    )
}

/**
 * Get PayPal webhook id used by the verify-webhook-signature API
 * (from terraform mount path).
 */
export const getPaypalWebhookId = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.paypalWebhookId,
        "utf8",
    )
}

/**
 * Get NOWPayments REST API key (from terraform mount path).
 */
export const getNowpaymentsApiKey = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.nowpaymentsApiKey,
        "utf8",
    )
}

/**
 * Get NOWPayments IPN secret used to verify HMAC-SHA512 callback signatures
 * (from terraform mount path).
 */
export const getNowpaymentsIpnSecret = (): string => {
    return readFileSync(
        envConfig().mountPath.terraform.nowpaymentsIpnSecret,
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