import {
    Injectable,
} from "@nestjs/common"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiByokInvalidException,
} from "@modules/platform/exceptions/errors/ai/ai-byok-invalid"
import {
    AiModelCatalogService,
} from "./balancer/ai-model-catalog.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import type {
    ValidateGradingLaneParams,
} from "./types/grading-lane-validation-params"
import type {
    ValidatedGradingLane,
} from "./types/grading"

@Injectable()
/**
 * Validates a grading model pick against entitlement and the `ai_models` catalog.
 *
 * Rules:
 * - **no model pinned** -- nothing to validate; the balancer picks from the
 *   user's entitled category chain.
 * - **model + provider pinned** -- both required together; gated on the UNLOCK
 *   (paid OR enrolled) and the model's category must be in the user's tier
 *   categories, with the row existing + `enabled`.
 */
export class GradingLaneValidationService {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) { }

    /**
     * Validate a grading model pick and return normalized job/DB fields.
     *
     * @param params - User id + model selection from GraphQL or enqueue.
     * @returns Fields to spread onto BullMQ payloads or `user_challenge_submissions`.
     * @throws AiModeNotEntitledException when a pinned model is not unlocked.
     * @throws AiByokInvalidException when model/provider rules are violated.
     */
    async validate(
        {
            userId,
            model,
            provider,
        }: ValidateGradingLaneParams,
    ): Promise<ValidatedGradingLane> {
        this.assertModelProviderPairing(
            model,
            provider,
        )

        // no model pinned -> the balancer picks from the entitled chain; nothing to validate
        if (!model?.trim() || !provider) {
            return {
            }
        }

        // a pinned model requires the UNLOCK (paid OR enrolled -- the StarCi rule,
        // same as the grade-time gate) and its category must be in the user's tier
        // categories (enroll-aware).
        await this.aiEntitlementService.assertCanUsePaidModels({
            userId,
        })
        const allowedCategories = await this.aiEntitlementService
            .resolveTierCategories({
                userId,
            })

        const row = await this.findEnabledCatalogRow(
            model.trim(),
            provider,
        )
        if (!allowedCategories.includes(row.category)) {
            throw new AiByokInvalidException({
                reason: `model category "${row.category}" is not included in your subscription`,
            })
        }

        return {
            gradingModel: row.name,
            gradingProvider: row.provider,
        }
    }

    /**
     * Require model + provider together or neither.
     */
    private assertModelProviderPairing(
        model?: string,
        provider?: ModelProvider,
    ): void {
        const hasModel = Boolean(model?.trim())
        const hasProvider = provider !== undefined && provider !== null
        if (hasModel !== hasProvider) {
            throw new AiByokInvalidException({
                reason: "model and provider must be supplied together",
            })
        }
    }

    /**
     * Look up one enabled catalog row by `(provider, name)`.
     */
    private async findEnabledCatalogRow(
        name: string,
        provider: NonNullable<ValidateGradingLaneParams["provider"]>,
    ): Promise<AiModelEntity> {
        const enabled = await this.aiModelCatalogService.enabledModels()
        const row = enabled.find(
            (candidate) => candidate.name === name
                && candidate.provider === provider,
        )
        if (!row) {
            throw new AiByokInvalidException({
                reason: `model "${name}" is not enabled for provider "${provider}"`,
            })
        }
        return row
    }
}
