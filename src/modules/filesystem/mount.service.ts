import {
    Injectable 
} from "@nestjs/common"
import {
    AppConfig
} from "./types"
import {
    getAppConfig,
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
    appConfig(): AppConfig {
        return getAppConfig()
    }
}
