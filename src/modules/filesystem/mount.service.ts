import {
    Injectable,
} from "@nestjs/common"
import {
    AppConfig,
    SeedConfig,
    SecretKeycloakAdmin,
} from "./types"
import {
    getAppConfig,
    getSeedConfig,
    getS3SecretAccessKey,
    getPayosApiKey,
    getGeminiApiKey,
    getOpenAiApiKey,
    getKeycloakClientSecret,
    getEncryptionKey,
    getGithubAccessToken,
    getDataGitToken,
    getGithubSecretKey,
    getSepayApiKey,
    getJudge0AuthToken,
    getStripeSecretKey,
    getStripeWebhookSecret,
    getPaypalClientId,
    getPaypalClientSecret,
    getPaypalWebhookId,
    getNowpaymentsApiKey,
    getNowpaymentsIpnSecret,
    getBrevoSmtpPassword,
    getAdminApiKey,
    getKeycloakAdmin,
    getOpenAiApiKeys,
    getGeminiApiKeys,
} from "./utils"
/**
 * Service responsible for reading secrets mounted into the container filesystem.
 *
 * Purpose:
 * - Avoid using process.env for sensitive secrets (prevents leaks via logs, APMs, or third-party libraries)
 * - Secrets are mounted as Kubernetes Secret volumes
 * - Secrets are accessed explicitly and on demand via the filesystem
 *
 * This follows best practices for Node.js applications running on Kubernetes.
 */
@Injectable()
export class MountFilesystemService {
    /**
     * Get app config (from mount path or provided value).
     */
    appConfig(): AppConfig {
        return getAppConfig()
    }

    /**
     * Get the init-control config (parsed `seed.yaml` from the mount path).
     *
     * Drives the boot-time init: which seeders / synchronizers run and how far
     * each phase is scoped. Consumed by the init scope services.
     */
    seedConfig(): SeedConfig {
        return getSeedConfig()
    }

    /**
     * Get s3 secret access key from mount path.
     */
    s3SecretAccessKey(): string {
        return getS3SecretAccessKey()
    }

    /**
     * Get keycloak client secret from mount path.
     */
    keycloakClientSecret(): string {
        return getKeycloakClientSecret()
    }

    /**
     * Get AES encryption key from mount path.
     */
    encryptionKey(): string {
        return getEncryptionKey()
    }

    /**
     * Get payos api key from mount path.
     */
    payosApiKey(): string {
        return getPayosApiKey()
    }

    /**
     * Get gemini api key from mount path.
     */
    geminiApiKey(): string {
        return getGeminiApiKey()
    }

    /**
     * Get openai api key from mount path.
     */
    openAiApiKey(): string {
        return getOpenAiApiKey()
    }

    /**
     * Get github access token from mount path.
     */
    githubAccessToken(): string {
        return getGithubAccessToken()
    }

    /**
     * Get the data-git token (dedicated read-only token for the content repo;
     * falls back to the github access token when the file is absent).
     */
    dataGitToken(): string {
        return getDataGitToken()
    }

    /**
     * Get github secret key from mount path.
     */
    githubSecretKey(): string {
        return getGithubSecretKey()
    }

    /**
     * Get sepay api key from mount path.
     */
    sepayApiKey(): string {
        return getSepayApiKey()
    }

    /**
     * Get the Judge0 X-Auth-Token from mount path (empty when auth is disabled).
     */
    judge0AuthToken(): string {
        return getJudge0AuthToken()
    }

    /**
     * Get Stripe secret API key from mount path.
     */
    stripeSecretKey(): string {
        return getStripeSecretKey()
    }

    /**
     * Get Stripe webhook signing secret from mount path.
     */
    stripeWebhookSecret(): string {
        return getStripeWebhookSecret()
    }

    /**
     * Get PayPal REST app client id from mount path.
     */
    paypalClientId(): string {
        return getPaypalClientId()
    }

    /**
     * Get PayPal REST app client secret from mount path.
     */
    paypalClientSecret(): string {
        return getPaypalClientSecret()
    }

    /**
     * Get PayPal webhook id from mount path.
     */
    paypalWebhookId(): string {
        return getPaypalWebhookId()
    }

    /**
     * Get NOWPayments REST API key from mount path.
     */
    nowpaymentsApiKey(): string {
        return getNowpaymentsApiKey()
    }

    /**
     * Get NOWPayments IPN secret from mount path.
     */
    nowpaymentsIpnSecret(): string {
        return getNowpaymentsIpnSecret()
    }

    /**
     * Get Brevo SMTP password from mount path.
     */
    brevoSmtpPassword(): string {
        return getBrevoSmtpPassword()
    }

    /**
     * Get admin API key from mount path.
     */
    adminApiKey(): string {
        return getAdminApiKey()
    }

    /**
     * Get keycloak admin credentials from mount path.
     */
    keycloakAdmin(): SecretKeycloakAdmin {
        return getKeycloakAdmin()
    }

    /**
     * Get the OpenAI API-key pool (newline-separated mount file).
     *
     * @returns Array of trimmed, non-empty keys; empty when the file is missing or empty
     */
    openAiApiKeys(): Array<string> {
        return getOpenAiApiKeys()
    }

    /**
     * Get the Gemini API-key pool (newline-separated mount file).
     *
     * @returns Array of trimmed, non-empty keys; empty when the file is missing or empty
     */
    geminiApiKeys(): Array<string> {
        return getGeminiApiKeys()
    }
}
