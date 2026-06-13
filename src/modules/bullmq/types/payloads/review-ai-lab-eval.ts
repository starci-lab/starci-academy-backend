import {
    Locale,
} from "@modules/databases"
import type {
    AiLabRunParams,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "@modules/ai"

/**
 * Payload for the review-ai-lab-eval BullMQ queue. Carries everything the
 * eval-runner worker needs to grade a submitted prompt template against an eval
 * set's cases and persist the verdict back onto the {@link AiLabEvalRunEntity}.
 */
export interface ReviewAiLabEvalPayload {
    /** Eval run row (already persisted as Pending) the verdict is written back to. */
    evalRunId: string
    /** Eval set whose cases the submission is graded against. */
    evalSetId: string
    /** Learner who submitted the eval run. */
    userId: string
    /** Enrollment the submission was made under. */
    enrollmentId: string
    /** Submitted system prompt (omitted when the learner sent none). */
    submittedSystemPrompt?: string
    /** Submitted user prompt template (contains the `{{input}}` placeholder). */
    submittedUserTemplate: string
    /** Sampling / generation parameters submitted for grading. */
    params: AiLabRunParams
    /** Locale hint for the judge feedback language (e.g. "en", "vi"). */
    locale?: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
}
