import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Coarse category tag attached to every AI model in the `ai_models` catalog.
 *
 * Three tiers, named by CAPABILITY rather than by a marketing word:
 * - `low` -- the cheap, fast rung the chatbot runs on.
 * - `medium` -- the grading workhorse (challenge / milestone / CV / interview).
 * - `high` -- the strongest models, reached only by pinning one explicitly.
 *
 * Inside a tier `weight` (derived from price + context) decides which model is
 * tried first -- cheapest that is good enough.
 *
 * Renamed from the old five-value scheme (free/economy/balanced/premium/frontier):
 * the two middle rungs were never populated, and a capability name reads truer
 * than a price label. The DB `ai_model_category` enum is migrated value-by-value
 * (add -> UPDATE rows -> recreate the type) rather than through synchronize, which
 * cannot rename an enum value -- see the migration in
 * `.claude/context/starci/states/ai/migration-category-low-medium-high.sql`.
 *
 * Low/Medium/High are a SEPARATE axis from the two embedding members below --
 * they are the business tiers a customer is entitled to, and the embedding
 * pair is never inserted into that ladder or compared against it.
 *
 * THE EMBEDDING AXIS: `EmbeddingLocal` and `EmbeddingCloud` name where the
 * vectorizing work runs and whose documents it touches, not how it is batched.
 * Both lanes MUST serve the same model at the same width -- Qwen3-Embedding-8B
 * at 4096 dimensions, whether reached on the owner's self-hosted GPU box or
 * over the OpenRouter API -- because Qdrant accepts any vector of the right
 * width with no error and no log line: an index built by one lane and queried
 * by the other returns confidently wrong results with nothing to say when it
 * started. Renamed from `EmbeddingBulk` / `EmbeddingDoc` (embedding_bulk /
 * embedding_doc), which named the batching shape instead of the axis; see the
 * rename migration `RenameEmbeddingAiModelCategories1726500000000`.
 */
export enum AiModelCategory {
    /** Cheap, fast; the chatbot rung. */
    Low = "low",
    /** The grading workhorse rung. */
    Medium = "medium",
    /** Strongest models; reached only by an explicit pin. */
    High = "high",
    /**
     * Self-hosted embedding lane (Qwen3-Embedding-8B @ 4096, on the owner's own
     * GPU box). Cost 0. Vectorizes documents the PLATFORM OWNS -- material that
     * never needs to leave the owner's infrastructure and can afford to wait if
     * the box is briefly down. Using this for a customer's just-uploaded
     * document stalls their request on a machine that may be switched off.
     */
    EmbeddingLocal = "embedding_local",
    /**
     * Cloud embedding lane (the same Qwen3-Embedding-8B @ 4096, served over the
     * OpenRouter API). Billed per token. Vectorizes documents A CUSTOMER
     * UPLOADED -- work a person may be waiting on, so it must not stall because
     * the owner's GPU box is offline. Using this for bulk platform-corpus
     * indexing spends cloud tokens on work that could have run for free.
     */
    EmbeddingCloud = "embedding_cloud",
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
            [AiModelCategory.EmbeddingLocal]: {
                description: "Self-hosted embedding lane for the platform's own documents; cost 0.",
            },
            [AiModelCategory.EmbeddingCloud]: {
                description: "Cloud embedding lane for a customer-uploaded document; billed per token.",
            },
        },
    },
)
