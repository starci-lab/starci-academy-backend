import type {
    AiInvokeByok,
} from "@modules/ai"
import type {
    AiModelCategory,
} from "@modules/databases"

/**
 * The AI-invoke decision resolved once in the plan step and reused by analyze.
 * Holds the `invoke` args (`byok` OR `category`) chosen for this CV review.
 */
export interface CvAiInvokeDecision {
    /** Category to grade with (auto/premium path); omitted in byok mode. */
    category?: AiModelCategory
    /** BYOK descriptor (byok mode); omitted otherwise. */
    byok?: AiInvokeByok
}
