import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-ping.module-definition"
import {
    AiPingService,
} from "./ai-ping.service"
import {
    GeminiPingService,
} from "./gemini-ping.service"
import {
    OpenAiPingService,
} from "./openai-ping.service"
import {
    OpenRouterPingService,
} from "./openrouter-ping.service"

@Module({
    providers: [
        OpenAiPingService,
        GeminiPingService,
        OpenRouterPingService,
        AiPingService,
    ],
    exports: [
        AiPingService,
    ],
})
/**
 * AI ping sub-module -- zero-token provider health checks.
 *
 * - One {@link *PingService} per {@link ModelProvider} -- each runs its own
 *   staggered mount-key sweep on boot via {@link AbstractProviderPingService}.
 * - {@link AiPingService} routes ad-hoc {@link AiPingService.pingKey} calls.
 *
 * NOTE: the per-MODEL latency probe ({@link AiModelLatencyService}) is NOT
 * registered here -- it needs the balancer's {@link UseApiService} and
 * {@link AiModelCatalogService}, so {@link AiModule} (which imports both this
 * module and {@link AiBalancerModule}) owns that provider to avoid instantiating
 * the balancer twice.
 *
 * Consumed by {@link AiModule} and {@link AiBalancerModule}.
 */
export class AiPingModule extends ConfigurableModuleClass {}
