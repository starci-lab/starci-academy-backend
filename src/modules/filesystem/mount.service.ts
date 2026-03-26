import {
    Injectable 
} from "@nestjs/common"
import {
    AppConfig
} from "./types"
import {
    getAppConfig,
    getKeycloakClientSecret,
    getS3SecretAccessKey,
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
     * Get keycloak client secret (from mount path or provided value).
     */
    keycloakClientSecret(): string {
        return getKeycloakClientSecret()
    }

    /**
     * Get S3 secret access key (from mount path or provided value).
     */
    s3SecretAccessKey(): string {
        return getS3SecretAccessKey()
    }
}
