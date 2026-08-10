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
    envConfig,
} from "@modules/platform/env/config"
import type {
    AppConfig,
} from "../types/config"
import type {
    SecretKeycloakAdmin,
} from "../types/secrets"

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

/**
 * Resolves app catalog: explicit override -> post-seed runtime merge -> disk
 * `app.yaml`. Init merges mount AI models/subscriptions into memory; reading
 * the file alone would drop that merge until the next process restart.
 */
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

/*
 * EVERY READER BELOW IS NOW A LOOKUP, NOT A FILE READ.
 *
 * These used to each open a `*_MOUNT_PATH` file with `readFileSync` on every
 * call. The `<KEY>_FILE` pointer convention moved that I/O into
 * `parseEnvSecret` (`src/modules/platform/env/utils/parse-env.ts`), which
 * resolves the value once while `envConfig()` is being built and fails the boot
 * outright when a declared pointer cannot be read. The functions are kept --
 * with the same names and the same return shapes -- because they are the stable
 * surface a hundred call sites already ask for a credential through, and
 * because several of them still carry real fallback logic that belongs here
 * rather than in the config tree.
 */

/**
 * Get S3 secret access key.
 */
export const getS3SecretAccessKey = (): string => {
    return envConfig().secrets.s3SecretAccessKey
}

/**
 * Get PayOS API key.
 */
export const getPayosApiKey = (): string => {
    return envConfig().secrets.payosApiKey
}

/**
 * Split a newline-separated key pool into trimmed, non-empty keys.
 *
 * Pool format (one key per line):
 * ```
 * # Comment lines starting with `#` are skipped (use them to note key owner / expiry).
 * sk-aaa
 * sk-bbb
 *
 * # Blank lines and surrounding whitespace are stripped.
 * sk-ccc
 * ```
 *
 * Used by the AI Balancer feature to load rotating-key pools per provider. An
 * empty pool returns an empty array -- the caller treats that as "no key for
 * this provider" without crashing boot.
 *
 * @param raw - the pool contents, newline-separated
 * @returns Array of API keys; empty when the pool is empty or all comments
 */
export const parseApiKeys = (raw: string): Array<string> => {
    // split on any line break, trim, drop blanks and `#`-comments
    return raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
}

/**
 * Parse a key pool FILE into an array of trimmed, non-empty keys.
 *
 * Still a file read, and deliberately so: this path serves the model catalog's
 * `keysFilePath`, which names a pool per model at RUNTIME. Those names are data
 * in `app.yaml`, not keys known to `config.ts`, so they cannot go through the
 * `<KEY>_FILE` convention. Missing or unreadable file returns an empty array.
 *
 * @param path - absolute path to the key list file
 * @returns Array of API keys; empty when file missing / empty / unreadable
 */
export const parseApiKeysFile = (path: string): Array<string> => {
    if (!existsSync(path)) {
        return []
    }
    try {
        return parseApiKeys(readFileSync(
            path,
            "utf8",
        ))
    } catch {
        return []
    }
}

/**
 * Read an AI key pool by a model's `keysFilePath`. A BARE filename (no path
 * separator) is resolved inside the AI keys directory
 * (`mountPath.aiKeys.dir`, default `.mount/terraform/keys`); a value that
 * already contains a separator is treated as a full/relative path verbatim.
 *
 * @param fileNameOrPath - The catalog `keysFilePath` (filename or path).
 * @returns Trimmed, non-empty, non-comment keys; empty when unavailable.
 */
export const readAiKeysFile = (fileNameOrPath: string): Array<string> => {
    const hasSeparator = fileNameOrPath.includes("/")
        || fileNameOrPath.includes("\\")
    const resolved = hasSeparator
        ? fileNameOrPath
        : join(envConfig().mountPath.aiKeys.dir,
            fileNameOrPath)
    return parseApiKeysFile(resolved)
}

/**
 * Get the OpenAI API-key pool (newline-separated).
 * Empty array when the pool is unset.
 */
export const getOpenAiApiKeys = (): Array<string> => {
    return parseApiKeys(envConfig().secrets.aiKeys.openai)
}

/**
 * Get the Gemini API-key pool (newline-separated).
 * Empty array when the pool is unset.
 */
export const getGeminiApiKeys = (): Array<string> => {
    return parseApiKeys(envConfig().secrets.aiKeys.gemini)
}

/**
 * Get the Local (self-hosted) provider key -- the bearer token validated by the
 * Caddy gate in front of Ollama. Falls back to a single placeholder ("ollama")
 * when the pool is empty, so a direct, gate-less local Ollama still resolves an
 * eligible key (the endpoint ignores the value).
 */
export const getLocalApiKeys = (): Array<string> => {
    const keys = parseApiKeys(envConfig().secrets.aiKeys.local)
    return keys.length > 0 ? keys : ["ollama"]
}

/**
 * Get the OpenRouter API-key pool (newline-separated).
 * Empty array when the pool is unset.
 */
export const getOpenRouterApiKeys = (): Array<string> => {
    return parseApiKeys(envConfig().secrets.aiKeys.openrouter)
}

/**
 * Get the native Anthropic API-key pool.
 * Empty array when the pool is unset.
 */
export const getAnthropicApiKeys = (): Array<string> => {
    return parseApiKeys(envConfig().secrets.aiKeys.anthropic)
}

/**
 * Get keycloak client secret.
 */
export const getKeycloakClientSecret = (): string => {
    return envConfig().secrets.keycloakClientSecret
}

/**
 * Get AES encryption key.
 */
export const getEncryptionKey = (): string => {
    return envConfig().secrets.encryptionKey
}

/**
 * Get github access token.
 */
export const getGithubAccessToken = (): string => {
    return envConfig().secrets.githubAccessToken
}

/**
 * Get the data-git token used to pull the private content repo.
 *
 * Optional dedicated read-only token: when it is unset, fall back to the shared
 * github access token so existing deployments keep working.
 */
export const getDataGitToken = (): string => {
    const token = envConfig().secrets.dataGitToken
    // no dedicated token supplied -> reuse the shared github access token
    if (token === "") {
        return getGithubAccessToken().trim()
    }
    return token.trim()
}

/**
 * Get github secret key.
 */
export const getGithubSecretKey = (): string => {
    return envConfig().secrets.githubSecretKey
}

/**
 * Get Sepay API key.
 */
export const getSepayApiKey = (): string => {
    return envConfig().secrets.sepayApiKey
}

/**
 * Get the Judge0 `X-Auth-Token`.
 *
 * Optional: Judge0 can run without authentication, so an unset token is not an
 * error -- an empty string means "no token", and the client simply omits the
 * header.
 *
 * @returns The Judge0 auth token, or `""` when none is supplied.
 */
export const getJudge0AuthToken = (): string => {
    return envConfig().secrets.judge0AuthToken.trim()
}

/**
 * Get Stripe secret API key.
 */
export const getStripeSecretKey = (): string => {
    return envConfig().secrets.stripeSecretKey
}

/**
 * Get Stripe webhook signing secret.
 */
export const getStripeWebhookSecret = (): string => {
    return envConfig().secrets.stripeWebhookSecret
}

/**
 * Get PayPal REST app client id.
 */
export const getPaypalClientId = (): string => {
    return envConfig().secrets.paypalClientId
}

/**
 * Get PayPal REST app client secret.
 */
export const getPaypalClientSecret = (): string => {
    return envConfig().secrets.paypalClientSecret
}

/**
 * Get PayPal webhook id used by the verify-webhook-signature API.
 */
export const getPaypalWebhookId = (): string => {
    return envConfig().secrets.paypalWebhookId
}

/**
 * Get NOWPayments REST API key.
 */
export const getNowpaymentsApiKey = (): string => {
    return envConfig().secrets.nowpaymentsApiKey
}

/**
 * Get NOWPayments IPN secret used to verify HMAC-SHA512 callback signatures.
 */
export const getNowpaymentsIpnSecret = (): string => {
    return envConfig().secrets.nowpaymentsIpnSecret
}

/**
 * Get Brevo SMTP password/API key.
 */
export const getBrevoSmtpPassword = (): string => {
    return envConfig().secrets.brevoSmtpPassword
}

/**
 * Get admin API key.
 *
 * This used to open a HARD-CODED `.mount/terraform/admin-api-key.key` -- the
 * one credential in this file that no env key could re-point. It now has one
 * (`ADMIN_API_KEY` / `ADMIN_API_KEY_FILE`) like every other.
 */
export const getAdminApiKey = (): string => {
    return envConfig().secrets.adminApiKey
}

/**
 * Service account credentials for Google APIs (google-auth-library / googleapis).
 * Precedence: {@link envConfig.googleapis.serviceAccountJson} (full JSON string)
 * then {@link envConfig.secrets.gcpServiceAccountJson}. If neither is usable,
 * returns undefined (ADC / GOOGLE_APPLICATION_CREDENTIALS).
 */
export const getGcpServiceAccountCredentials = ():
    | Record<string, unknown>
    | undefined => {
    const raw = envConfig().secrets.gcpServiceAccountJson
    if (raw === "") {
        return undefined
    }
    try {
        return JSON.parse(raw) as Record<string, unknown>
    } catch {
        return undefined
    }
}

/**
 * Get keycloak admin credentials.
 */
export const getKeycloakAdmin = (): SecretKeycloakAdmin => {
    return JSON.parse(envConfig().secrets.keycloakAdmin) as SecretKeycloakAdmin
}
