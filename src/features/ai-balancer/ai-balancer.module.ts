import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-balancer.module-definition"
import {
    KeyStoreService,
    KeyRotatorService,
    KeyHealthService,
    AiBalancerService,
    UseApiService,
} from "./core"

/**
 * AI Balancer feature.
 *
 * Owns the rotating-API-key pool for every supported provider:
 *
 * - {@link KeyStoreService}  — loads keys from the mount files at boot via
 *                              `MountFilesystemService.{openAi,gemini,claude}ApiKeys()`.
 * - {@link KeyRotatorService} — round-robin picks next active key using a
 *                               Redis atomic counter (multi-instance safe).
 * - {@link KeyHealthService}  — periodic ping + disable/recover transitions,
 *                               driven by `envConfig().aiBalancer`.
 * - {@link AiBalancerService} — public façade: `acquire`, `markSuccess`,
 *                               `markFailure`, `healthSnapshot`, `reload`.
 *
 * Consumers (`AISecretService`, LangChain `ModelService`) ask the balancer
 * for a key per request instead of reading a single mount file — this
 * enables horizontal scaling across multiple provider keys without code
 * changes.
 */
@Module({
    providers: [
        KeyStoreService,
        KeyRotatorService,
        KeyHealthService,
        AiBalancerService,
        UseApiService,
    ],
    exports: [
        KeyStoreService,
        KeyRotatorService,
        KeyHealthService,
        AiBalancerService,
        UseApiService,
    ],
})
export class AiBalancerModule extends ConfigurableModuleClass { }
