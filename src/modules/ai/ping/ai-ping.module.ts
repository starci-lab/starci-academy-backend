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

/**
 * AI ping sub-module — zero-token provider health checks.
 *
 * - One {@link *PingService} per {@link ModelProvider} — each runs its own
 *   staggered mount-key sweep on boot via {@link AbstractProviderPingService}.
 * - {@link AiPingService} routes ad-hoc {@link AiPingService.pingKey} calls.
 *
 * Consumed by {@link AiModule} and {@link AiBalancerModule}.
 */
@Module({
    providers: [
        OpenAiPingService,
        GeminiPingService,
        AiPingService,
    ],
    exports: [
        AiPingService,
    ],
})
export class AiPingModule extends ConfigurableModuleClass {}
