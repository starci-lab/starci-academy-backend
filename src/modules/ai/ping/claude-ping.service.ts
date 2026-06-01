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
    CLAUDE_PING_AXIOS_KEY,
} from "./constants"
import type {
    PingKeyResult,
} from "./types"
import {
    toPingErrorMessage,
} from "./utils"

/**
 * Zero-token health ping for Anthropic Claude using `GET /v1/models`.
 * Runs its own staggered mount-key sweep on {@link envConfig().ai.ping} cadence.
 */
@Injectable()
export class ClaudePingService extends AbstractProviderPingService {
    /** Provider routed by {@link AiPingService.pingKey}. */
    protected readonly provider = ModelProvider.Claude

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
        return this.mountFilesystemService.claudeApiKeys()
    }

    /**
     * @inheritdoc
     */
    protected async executePing(key: string): Promise<PingKeyResult> {
        try {
            const axios = this.axiosService.create({
                key: CLAUDE_PING_AXIOS_KEY,
            })
            const response = await axios.get(
                "https://api.anthropic.com/v1/models",
                {
                    headers: {
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    },
                },
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
