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
import {
    AiLabEvalMetricService,
} from "./ai-lab-eval-metric.service"
import {
    AiLabEvalService,
} from "./ai-lab-eval.service"

/**
 * AI Lab business logic: playground reads + history, run orchestration (cache
 * lookup → entitlement gate → lane resolution → streaming hand-off), and the
 * eval-set grader (metrics + LLM judge) reused by the eval-runner processor.
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
        AiLabEvalMetricService,
        AiLabEvalService,
    ],
    exports: [
        AiLabPlaygroundService,
        AiLabCacheService,
        AiLabRunService,
        AiLabEvalMetricService,
        AiLabEvalService,
    ],
})
export class AiLabModule extends ConfigurableModuleClass {
}
