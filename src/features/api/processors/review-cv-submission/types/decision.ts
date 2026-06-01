import type {
    AiInvokeByok,
} from "@modules/ai"
import type {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"

/**
 * The AI-invoke decision resolved once in the plan step and reused by analyze.
 * Holds the `invoke` args (`byok` OR `category` + optional pinned model) chosen
 * for this CV review.
 */
export interface CvAiInvokeDecision {
    /** Category to grade with (premium path); omitted in byok mode. */
    category?: AiModelCategory
    /** BYOK descriptor (byok mode); omitted otherwise. */
    byok?: AiInvokeByok
    /** User-pinned model (premium lane); omitted when the balancer chooses. */
    model?: string
    /** Provider for {@link CvAiInvokeDecision.model}. */
    provider?: ModelProvider
}
