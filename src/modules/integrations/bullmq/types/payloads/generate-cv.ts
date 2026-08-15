import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import type {
    CvEvidenceSnapshot,
} from "@modules/databases/postgresql/primary/types/cv-evidence-snapshot"

/**
 * BullMQ job body for the CV generation pipeline (gather -> compose -> render -> complete).
 *
 * A `UserCvGenerationEntity` row (status `Pending`) is created by the enqueue service
 * BEFORE the job is queued; the worker updates that row to `Done`/`Failed`.
 */
export interface GenerateCvPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `cv_generations.id` -- the Pending row created at enqueue time. */
    cvGenerationId: string
    /** `users.id` -- owner of the generation run (used to gather verified achievements). */
    userId: string
    /** Whether this run builds a new CV or revises an existing submission. */
    mode: CvGenerationMode
    /**
     * `cv_submissions.id` of the legacy upload being revised -- REQUIRED semantics when
     * `mode` = `Revise` (the gather step extracts its uploaded file text), omitted for `Generate`.
     */
    sourceCvSubmissionId?: string
    /** User's free-text input describing projects, skills, and desired emphasis. */
    extraPrompts?: string
    /** Effective output locale, resolved before enqueue and stable across retries. */
    language: Locale
    /** Explicit seniority bar for compose and score. */
    targetLevel: CvTargetLevel
    /** Optional target role; absent means the documented generic role fallback. */
    targetRole?: string
    /** Immutable caller-selected passed-capstone snapshot. */
    selectedEvidence: CvEvidenceSnapshot
    /** AI lane + model pick (validated against entitlement at compose time). */
    ai?: AiJobSelection
}
