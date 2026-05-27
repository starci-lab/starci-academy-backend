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
 * Three tiers cover real cost/quality trade-offs without exploding the
 * surface area. Inside a tier `weight` decides which model is tried first.
 */
export enum AiModelCategory {
    /** Tiết kiệm — fast, cheap, smaller models. e.g. gpt-4o-mini, gemini-2.0-flash, claude-haiku. */
    Economy = "economy",
    /** Cân bằng — mid-tier cost/quality. e.g. gpt-4o, gemini-2.5-flash. */
    Balanced = "balanced",
    /** Cao cấp — flagship models, highest quality, highest cost. e.g. claude-sonnet-4-5, gemini-2.5-pro. */
    Premium = "premium",
}

export const GraphQLTypeAiModelCategory = createEnumType(AiModelCategory)

registerEnumType(
    GraphQLTypeAiModelCategory,
    {
        name: "AiModelCategory",
        description: "Coarse cost/quality category tag for AI models.",
        valuesMap: {
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
