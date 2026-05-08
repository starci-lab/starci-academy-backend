import {
    Injectable,
} from "@nestjs/common"
import {
    AppConfig,
    SecretKeycloakAdmin,
} from "./types"
import {
    getAppConfig,
    getS3SecretAccessKey,
    getPayosApiKey,
    getGeminiApiKey,
    getOpenAiApiKey,
    getKeycloakClientSecret,
    getEncryptionKey,
    getGithubAccessToken,
    getGithubSecretKey,
    getSepayApiKey,
    getBrevoSmtpPassword,
    getAdminApiKey,
    getKeycloakAdmin,
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
}
