import {
    Injectable,
} from "@nestjs/common"
import type {
    AppConfigSystemAiAuto,
} from "./types"
import {
    MountFilesystemService,
} from "./mount.service"
import {
    resolveAiAutoQuota,
} from "./utils/resolve-ai-auto-quota"

/**
 * Reads free Auto-lane quota caps from mounted `app.yaml` (`systemConfig.ai.auto`).
 */
@Injectable()
export class AiAutoQuotaConfigService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) {}

    /**
     * Resolved Auto caps (uses + credits per rolling window).
     */
    getAutoQuota(): AppConfigSystemAiAuto {
        return resolveAiAutoQuota(
            this.mountFilesystemService.appConfig(),
        )
    }
}
