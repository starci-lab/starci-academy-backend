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
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import OpenAI from "openai"
import {
    AbstractProviderPingService,
} from "./classes"
import type {
    PingKeyResult,
} from "./types"
import {
    toPingErrorMessage,
} from "./utils"

/**
 * Zero-token health ping for OpenAI using `GET /v1/models`.
 * Runs its own staggered mount-key sweep on {@link envConfig().ai.ping} cadence.
 */
@Injectable()
export class OpenAiPingService extends AbstractProviderPingService {
    /** Provider routed by {@link AiPingService.pingKey}. */
    protected readonly provider = ModelProvider.OpenAI

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
        return [
            ...this.mountFilesystemService.openAiApiKeys(),
            this.mountFilesystemService.openAiApiKey(),
        ]
    }

    /**
     * @inheritdoc
     */
    protected async executePing(key: string): Promise<PingKeyResult> {
        try {
            const client = new OpenAI({
                apiKey: key,
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
