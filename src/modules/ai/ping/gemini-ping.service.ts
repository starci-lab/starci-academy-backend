import {
    AiPingCacheService,
} from "@modules/integrations/cache/ai-ping-cache.service"
import {
    AxiosService,
} from "@modules/integrations/axios/axios.service"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractProviderPingService,
} from "./classes/abstract-provider-ping.service"
import {
    GEMINI_PING_AXIOS_KEY,
} from "./constants/axios-instance-key"
import type {
    PingKeyResult,
} from "./types/ping"
import {
    toPingErrorMessage,
} from "./utils/to-error-message"

@Injectable()
/**
 * Zero-token health ping for Google Gemini using `GET /v1beta/models`.
 * Runs its own staggered mount-key sweep on {@link envConfig().ai.ping} cadence.
 */
export class GeminiPingService extends AbstractProviderPingService {
    /** Provider routed by {@link AiPingService.pingKey}. */
    protected readonly provider = ModelProvider.Gemini

    constructor(
        private readonly axiosService: AxiosService,
        private readonly mountFilesystemService: MountFilesystemService,
        eventEmitterService: EventEmitterService,
        winstonService: WinstonService,
        aiPingCacheService: AiPingCacheService,
    ) {
        super(
            eventEmitterService,
            winstonService,
            aiPingCacheService,
        )
    }

    /**
     * @inheritdoc
     * Reads from `.mount/terraform/keys/gemini-api-keys.key` (pool) only.
     */
    protected listMountKeys(): Array<string> {
        return this.mountFilesystemService.geminiApiKeys()
    }

    /**
     * @inheritdoc
     */
    protected async executePing(key: string): Promise<PingKeyResult> {
        try {
            const axios = this.axiosService.create({
                key: GEMINI_PING_AXIOS_KEY,
            })
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
            )
            return {
                success: response.status >= 200 && response.status < 300,
                errorMessage: null,
            }
        } catch (err) {
            return {
                success: false,
                errorMessage: toPingErrorMessage(err),
            }
        }
    }
}
