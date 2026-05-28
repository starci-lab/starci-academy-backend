import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-balancer.module-definition"
import {
    AiModelCatalogService,
    KeyStoreService,
    KeyRotatorService,
    KeyHealthService,
    AiBalancerService,
    UseApiService,
} from "./core"

/**
 * AI Balancer sub-module — rotating key pool for every supported provider.
 *
 * - {@link KeyStoreService}   — loads keys from mount files at boot.
 * - {@link KeyRotatorService} — round-robin picks the next active key.
 * - {@link KeyHealthService}  — periodic ping + disable/recover transitions.
 * - {@link AiBalancerService} — public façade: acquire, markSuccess, markFailure,
 *                               healthSnapshot, reload.
 * - {@link UseApiService}     — high-level wrapper: model fallback chain + key
 *                               rotation hidden from callers.
 *
 * Consumed by {@link AiModule} — do not register separately in AppModule.
 */
@Module({
    providers: [
        AiModelCatalogService,
        KeyStoreService,
        KeyRotatorService,
        KeyHealthService,
        AiBalancerService,
        UseApiService,
    ],
    exports: [
        AiModelCatalogService,
        KeyStoreService,
        KeyRotatorService,
        KeyHealthService,
        AiBalancerService,
        UseApiService,
    ],
})
export class AiBalancerModule extends ConfigurableModuleClass {}
