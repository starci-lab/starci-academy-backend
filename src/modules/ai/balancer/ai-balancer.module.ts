import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-balancer.module-definition"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    AiBalancerService,
} from "./ai-balancer.service"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    UseApiService,
} from "./use-api.service"

/**
 * AI Balancer — mount key pools, Redis-backed health cache, and invoke routing.
 *
 * - {@link KeyStoreService} — loads keys from mount files.
 * - {@link KeyRotatorService} — round-robin; skips keys with `status: false` in Redis.
 * - {@link UseApiService} — `useApi` (lane-discriminated: auto / premium).
 * - {@link AiBalancerService} — acquire + admin health snapshot.
 */
@Module({
    providers: [
        AiModelCatalogService,
        KeyStoreService,
        KeyRotatorService,
        AiBalancerService,
        UseApiService,
    ],
    exports: [
        AiModelCatalogService,
        KeyStoreService,
        KeyRotatorService,
        AiBalancerService,
        UseApiService,
    ],
})
export class AiBalancerModule extends ConfigurableModuleClass {}
