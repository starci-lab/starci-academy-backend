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
     * BULK embedding — vectorizing a large corpus (indexing the whole source).
     * Runs on the self-hosted 8B model: cost 0, throughput over latency, so a big
     * one-off index never spends cloud tokens. A separate axis, never on a
     * grading/chat ladder.
     */
    EmbeddingBulk = "embedding_bulk",
    /**
     * DOCUMENT embedding — vectorizing a single document or a learner's code on
     * demand (per-request, latency-sensitive). Runs on a cloud model. Also a
     * separate axis, selected by the embedding task, cheapest-first within it.
     */
    EmbeddingDoc = "embedding_doc",
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
            [AiModelCategory.EmbeddingBulk]: {
                description: "Bulk vectorizing of a large corpus; self-hosted, cost 0.",
            },
            [AiModelCategory.EmbeddingDoc]: {
                description: "On-demand vectorizing of one document or learner code; cloud.",
            },
        },
    },
)
