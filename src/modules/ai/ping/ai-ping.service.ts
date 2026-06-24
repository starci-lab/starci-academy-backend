import {
    ModelProvider,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    GeminiPingService,
} from "./gemini-ping.service"
import {
    OpenAiPingService,
} from "./openai-ping.service"
import type {
    PingKeyParams,
    PingKeyResult,
} from "./types"

/**
 * Routes zero-token provider pings to the correct {@link *PingService}.
 *
 * Used by the AI Balancer health checker and model-router quota checks.
 */
@Injectable()
export class AiPingService {
    constructor(
        private readonly openAiPingService: OpenAiPingService,
        private readonly geminiPingService: GeminiPingService,
    ) { }

    /**
     * Ping a provider with an explicit API key.
     * @param params - Provider and raw key value.
     * @returns Structured ping outcome for balancer health checks.
     */
    async pingKey({
        provider,
        key,
    }: PingKeyParams): Promise<PingKeyResult> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.openAiPingService.ping(key)
        case ModelProvider.Gemini:
            return this.geminiPingService.ping(key)
        default:
            return {
                success: false,
                errorMessage: `unsupported provider ${provider}`,
            }
        }
    }

    /**
     * Read mount keys for one provider (delegates to that provider's ping service).
     * @param provider - Target provider.
     * @returns De-duplicated non-empty keys in stable order.
     */
    listKeysForProvider(provider: ModelProvider): Array<string> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.openAiPingService.listKeys()
        case ModelProvider.Gemini:
            return this.geminiPingService.listKeys()
        default:
            return []
        }
    }
}
