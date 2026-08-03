import {
    CvGenerationMode,
    Locale,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "@modules/ai"

/**
 * BullMQ job body for the CV generation pipeline (gather → compose → render → complete).
 *
 * A `UserCvGenerationEntity` row (status `Pending`) is created by the enqueue service
 * BEFORE the job is queued; the worker updates that row to `Done`/`Failed`.
 */
export interface GenerateCvPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `cv_generations.id` — the Pending row created at enqueue time. */
    cvGenerationId: string
    /** `users.id` — owner of the generation run (used to gather verified achievements). */
    userId: string
    /** Whether this run builds a new CV or revises an existing submission. */
    mode: CvGenerationMode
    /**
     * `cv_submissions.id` of the legacy upload being revised — REQUIRED semantics when
     * `mode` = `Revise` (the gather step extracts its uploaded file text), omitted for `Generate`.
     */
    sourceCvSubmissionId?: string
    /** User's free-text input describing projects, skills, and desired emphasis. */
    extraPrompts?: string
    /** Locale hint for prompting the LLM (e.g. "en", "vi"). */
    locale?: Locale
    /** AI lane + model pick (validated against entitlement at compose time). */
    ai?: AiJobSelection
}
