import {
    AiPingCacheService,
} from "@modules/cache"
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
    envConfig,
} from "@modules/env"
import {
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import OpenAI from "openai"
import {
    AbstractProviderPingService,
} from "./classes/abstract-provider-ping.service"
import type {
    PingKeyResult,
} from "./types/ping"
import {
    toPingErrorMessage,
} from "./utils/to-error-message"

@Injectable()
/**
 * Zero-token health ping for OpenRouter using `GET /api/v1/models` (the gateway
 * is OpenAI-compatible). Reuses the `openai` SDK pointed at the OpenRouter
 * baseURL. Runs its own staggered mount-key sweep on {@link envConfig().ai.ping}
 * cadence.
 */
export class OpenRouterPingService extends AbstractProviderPingService {
    /** Provider routed by {@link AiPingService.pingKey}. */
    protected readonly provider = ModelProvider.OpenRouter

    constructor(
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
        return this.mountFilesystemService.openRouterApiKeys()
    }

    /**
     * @inheritdoc
     */
    protected async executePing(key: string): Promise<PingKeyResult> {
        try {
            const client = new OpenAI({
                apiKey: key,
                baseURL: envConfig().ai.openrouter.baseUrl,
            })
            const models = await client.models.list()
            return {
                success: models.data.length > 0,
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
