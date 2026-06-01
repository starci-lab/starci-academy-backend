import {
    AiPingCacheService,
} from "@modules/cache"
import {
    AxiosService,
} from "@modules/axios"
import {
    ModelProvider,
} from "@modules/databases"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    EventEmitterService,
} from "@modules/event"
import {
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractProviderPingService,
} from "./classes"
import {
    GEMINI_PING_AXIOS_KEY,
} from "./constants"
import type {
    PingKeyResult,
} from "./types"
import {
    toPingErrorMessage,
} from "./utils"

/**
 * Zero-token health ping for Google Gemini using `GET /v1beta/models`.
 * Runs its own staggered mount-key sweep on {@link envConfig().ai.ping} cadence.
 */
@Injectable()
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
     */
    protected listMountKeys(): Array<string> {
        return [
            ...this.mountFilesystemService.geminiApiKeys(),
            this.mountFilesystemService.geminiApiKey(),
        ]
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
