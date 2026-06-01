import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    modelTierMatrix,
} from "./constants"
import type {
    AiTaskKind,
    ModelChoice,
    ModelRecommendation,
} from "./types"

/**
 * Static task → model mapping from {@link modelTierMatrix} + env tier.
 *
 * Replaces the old per-task router services: runtime key health and fallback
 * are handled by {@link UseApiService} + Redis ping cache; this service only
 * exposes the configured primary model and fallback chain for UI / enqueue defaults.
 */
@Injectable()
export class AiTaskModelService {
    /**
     * Primary model choice for a task kind at the current recommendation tier.
     * @param taskKind - Which AI task row to read from the tier matrix.
     * @returns First entry in the tier's fallback chain.
     */
    primaryChoice(
        taskKind: AiTaskKind,
    ): ModelChoice {
        return this.fallbackChain(taskKind)[0]
    }

    /**
     * Ordered fallback chain for a task kind at the current recommendation tier.
     * @param taskKind - Which AI task row to read from the tier matrix.
     * @returns Model choices (index 0 = primary).
     */
    fallbackChain(
        taskKind: AiTaskKind,
    ): Array<ModelChoice> {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation
        return modelTierMatrix[taskKind][tier]
            ?? modelTierMatrix[taskKind][ModelRecommendation.Low]
    }
}
