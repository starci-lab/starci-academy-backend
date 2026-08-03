import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab.module-definition"
import {
    AiLabPlaygroundService,
} from "./ai-lab-playground.service"
import {
    AiLabCacheService,
} from "./ai-lab-cache.service"
import {
    AiLabRunService,
} from "./ai-lab-run.service"

/**
 * AI Lab business logic: playground reads + history and run orchestration (cache
 * lookup → entitlement gate → lane resolution → streaming hand-off).
 *
 * `AiInvokeService` / `AiEntitlementService` / `GradingLaneValidationService`
 * come from the globally-registered `AiModule`, `EmbeddingModelService` from
 * `LangchainModule`, and `CacheService` from `CacheModule` — all global, so no
 * explicit imports are needed here.
 */
@Module({
    providers: [
        AiLabPlaygroundService,
        AiLabCacheService,
        AiLabRunService,
    ],
    exports: [
        AiLabPlaygroundService,
        AiLabCacheService,
        AiLabRunService,
    ],
})
export class AiLabModule extends ConfigurableModuleClass {
}
