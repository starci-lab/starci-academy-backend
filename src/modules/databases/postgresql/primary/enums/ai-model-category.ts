import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Coarse category tag attached to every AI model in the `ai_models` catalog.
 *
 * Drives:
 * - User-facing "tier" selection — caller asks `useApi({ category })` to pick
 *   a model of the requested class.
 * - Frontend badges / labels next to the model name on the admin panel.
 * - Pricing presentation (cheap vs premium).
 *
 * Four tiers cover real cost/quality trade-offs without exploding the
 * surface area. Inside a tier `priority` decides which model is tried first.
 */
export enum AiModelCategory {
    /** Miễn phí — self-hosted local model (Qwen), 0 credit. Usable without a plan. */
    Free = "free",
    /** Tiết kiệm — cheap cloud models. e.g. gpt-5.4-nano, gemini-2.5-flash-lite. */
    Economy = "economy",
    /** Cân bằng — mid-tier cost/quality. e.g. gpt-5-mini, gemini-2.5-flash. */
    Balanced = "balanced",
    /** Cao cấp — flagship models, highest quality, highest cost. e.g. gemini-2.5-pro. */
    Premium = "premium",
}

export const GraphQLTypeAiModelCategory = createEnumType(AiModelCategory)

registerEnumType(
    GraphQLTypeAiModelCategory,
    {
        name: "AiModelCategory",
        description: "Coarse cost/quality category tag for AI models.",
        valuesMap: {
            [AiModelCategory.Free]: {
                description: "Miễn phí — self-hosted local model, 0 credit, no plan needed.",
            },
            [AiModelCategory.Economy]: {
                description: "Tiết kiệm — fast, cheap, smaller models.",
            },
            [AiModelCategory.Balanced]: {
                description: "Cân bằng — mid-tier cost/quality.",
            },
            [AiModelCategory.Premium]: {
                description: "Cao cấp — flagship models, highest quality.",
            },
        },
    },
)
