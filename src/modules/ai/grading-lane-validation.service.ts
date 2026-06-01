import {
    Injectable,
} from "@nestjs/common"
import {
    AiMode,
    AiModelCategory,
    AiModelEntity,
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import {
    AiModelCatalogService,
} from "./balancer"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import type {
    ValidatedGradingLane,
    ValidateGradingLaneParams,
} from "./types"

/**
 * Validates grading lane + model picks against entitlement and the `ai_models` catalog.
 *
 * Rules:
 * - **auto** — `model` / `provider` optional; when set, both required and the row must be
 *   `enabled` + `complimentary`.
 * - **premium** / **byok** — `model` + `provider` required; premium rows must exist in catalog
 *   and be `enabled`; BYOK does not require a catalog row.
 */
@Injectable()
export class GradingLaneValidationService {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) { }

    /**
     * Validate a grading lane request and return normalized job/DB fields.
     *
     * @param params - User id + lane/model selection from GraphQL or enqueue.
     * @returns Fields to spread onto BullMQ payloads or `user_challenge_submissions`.
     * @throws AiModeNotEntitledException when the lane is unavailable.
     * @throws AiByokInvalidException when model/provider rules are violated.
     */
    async validate(
        {
            userId,
            mode: requestedMode,
            model,
            provider,
            byokApiKey,
        }: ValidateGradingLaneParams,
    ): Promise<ValidatedGradingLane> {
        const entitlement = await this.aiEntitlementService.resolve({
            userId,
            requestedMode,
            ephemeralByok: requestedMode === AiMode.Byok
                && Boolean(byokApiKey?.trim()),
        })

        this.assertModelProviderPairing(
            model,
            provider,
        )

        switch (entitlement.mode) {
        case AiMode.Byok:
            return this.validateByokLane(
                {
                    userId,
                    model,
                    provider,
                    byokApiKey,
                },
            )
        case AiMode.Premium:
            return this.validatePremiumLane(
                {
                    model,
                    provider,
                    allowedCategories: entitlement.allowedCategories,
                },
            )
        default:
            return this.validateAutoLane(
                {
                    model,
                    provider,
                },
            )
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
     * BYOK — model + provider required; key may be inline or on file.
     */
    private async validateByokLane(
        {
            userId,
            model,
            provider,
            byokApiKey,
        }: {
            userId: string
            model?: string
            provider?: ValidateGradingLaneParams["provider"]
            byokApiKey?: string
        },
    ): Promise<ValidatedGradingLane> {
        if (!model?.trim() || !provider) {
            throw new AiByokInvalidException({
                reason: "model and provider are required for BYOK grading",
            })
        }

        if (!byokApiKey?.trim()) {
            const storedKey = await this.aiEntitlementService.getByokApiKey({
                userId,
            })
            if (!storedKey) {
                throw new AiByokInvalidException({
                    reason: "no BYOK key on file — add a key in AI settings or pass byokApiKey",
                })
            }
        }

        return {
            mode: AiMode.Byok,
            byokProvider: provider,
            byokModel: model.trim(),
            ...(byokApiKey?.trim()
                ? {
                    byokApiKey: byokApiKey.trim(),
                }
                : {
                }),
        }
    }

    /**
     * Premium — model + provider required and must match an enabled catalog row.
     */
    private async validatePremiumLane(
        {
            model,
            provider,
            allowedCategories,
        }: {
            model?: string
            provider?: ValidateGradingLaneParams["provider"]
            allowedCategories: Array<AiModelCategory>
        },
    ): Promise<ValidatedGradingLane> {
        if (!model?.trim() || !provider) {
            throw new AiByokInvalidException({
                reason: "model and provider are required for Premium grading",
            })
        }

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
            mode: AiMode.Premium,
            gradingModel: row.name,
            gradingProvider: row.provider,
        }
    }

    /**
     * Auto — model optional; when set, must be a complimentary enabled catalog row.
     */
    private async validateAutoLane(
        {
            model,
            provider,
        }: {
            model?: string
            provider?: ValidateGradingLaneParams["provider"]
        },
    ): Promise<ValidatedGradingLane> {
        if (!model?.trim() || !provider) {
            return {
                mode: AiMode.Auto,
            }
        }

        const row = await this.findEnabledCatalogRow(
            model.trim(),
            provider,
        )
        if (!row.complimentary) {
            throw new AiByokInvalidException({
                reason: "selected model is not available on the Auto lane",
            })
        }

        return {
            mode: AiMode.Auto,
            gradingModel: row.name,
            gradingProvider: row.provider,
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
