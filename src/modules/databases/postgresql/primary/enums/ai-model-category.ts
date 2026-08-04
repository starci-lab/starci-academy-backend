import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Coarse category tag attached to every AI model in the `ai_models` catalog.
 *
 * Three tiers, named by CAPABILITY rather than by a marketing word:
 * - `low` — the cheap, fast rung the chatbot runs on.
 * - `medium` — the grading workhorse (challenge / milestone / CV / interview).
 * - `high` — the strongest models, reached only by pinning one explicitly.
 *
 * Inside a tier `weight` (derived from price + context) decides which model is
 * tried first — cheapest that is good enough.
 *
 * Renamed from the old five-value scheme (free/economy/balanced/premium/frontier):
 * the two middle rungs were never populated, and a capability name reads truer
 * than a price label. The DB `ai_model_category` enum is migrated value-by-value
 * (add → UPDATE rows → recreate the type) rather than through synchronize, which
 * cannot rename an enum value — see the migration in `.artifacts/states/ai/`.
 */
export enum AiModelCategory {
    /** Cheap, fast; the chatbot rung. */
    Low = "low",
    /** The grading workhorse rung. */
    Medium = "medium",
    /** Strongest models; reached only by an explicit pin. */
    High = "high",
    /**
     * Text-vectorizing models for RAG (indexing the source) — a separate axis,
     * not a rung above the others. Never enters a grading chain or a chat pick;
     * embedding models are selected by the `embedding` supportedTask, and within
     * this tier the same cheapest-first weight rule applies.
     */
    Embedding = "embedding",
}

export const GraphQLTypeAiModelCategory = createEnumType(AiModelCategory)

registerEnumType(
    GraphQLTypeAiModelCategory,
    {
        name: "AiModelCategory",
        description: "Capability tier of an AI model: low (chat), medium (grading), high (deep).",
        valuesMap: {
            [AiModelCategory.Low]: {
                description: "Cheap, fast; the chatbot rung.",
            },
            [AiModelCategory.Medium]: {
                description: "The grading workhorse rung.",
            },
            [AiModelCategory.High]: {
                description: "Strongest models, reached only by an explicit pin.",
            },
            [AiModelCategory.Embedding]: {
                description: "Text-vectorizing models for RAG; selected by task, not a rung.",
            },
        },
    },
)
