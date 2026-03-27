import {
    Injectable 
} from "@nestjs/common"
import {
    AppConfig
} from "./types"
import {
    getAppConfig,
} from "./utils"
import {
    envConfig 
} from "@modules/env"
import {
    readFileSync 
} from "fs"
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
        return readFileSync(
            envConfig().mountPath.terraform.s3SecretAccessKey,
            "utf8"
        )
    }

    /**
     * Get keycloak client secret from mount path.
     */
    keycloakClientSecret(): string {
        return readFileSync(
            envConfig().mountPath.terraform.keycloakClientSecret,
            "utf8"
        )
    }
}
