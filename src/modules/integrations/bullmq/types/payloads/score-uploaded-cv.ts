import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    Locale,
} from "@modules/databases"

/**
 * BullMQ job body for the UPLOAD-scoring pipeline (WF-07): grade a user-UPLOADED
 * CV that already lives in the unified `cv_generations` table
 * (`source = uploaded`, `uploadedCdnKey` set).
 *
 * The `cv_generations` row (status `Pending`) is created by the `uploadCv`
 * mutation handler BEFORE this job is enqueued; the single-step worker buffers
 * the uploaded file, extracts its text, scores it with the shared rubric, and
 * writes `score` + `feedback` back onto that same row (Done), or marks it Failed.
 */
export interface ScoreUploadedCvPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `cv_generations.id` -- the Pending uploaded row created at enqueue time. */
    cvGenerationId: string
    /** `users.id` -- owner of the uploaded CV (drives AI entitlement / lane routing). */
    userId: string
    /** Locale hint so the AI feedback is written in the learner's language. */
    locale?: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK) for the scoring call. */
    ai?: AiJobSelection
}
