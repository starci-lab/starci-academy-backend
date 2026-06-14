import type {
    GradeEvalSetResult,
} from "@modules/bussiness"
import type {
    AiMode,
    ModelProvider,
} from "@modules/databases"

/**
 * Model/provider/lane resolved for an eval grading run, persisted onto the
 * {@link AiLabEvalRunEntity} by the complete step for display + billing audit.
 */
export interface ReviewAiLabEvalAiUsage {
    /** Concrete model the grading invokes ran on (null when unresolved). */
    model: string | null
    /** Provider matching {@link ReviewAiLabEvalAiUsage.model} (null when unresolved). */
    provider: ModelProvider | null
    /** AI lane the grading run was billed on. */
    mode: AiMode
}

/**
 * Execution result the eval-runner grade step (step 0) persists for the
 * complete step (step 1) to read back. Carries the aggregated verdict, the
 * per-case results, and the model/provider/lane the grading run resolved to.
 */
export interface ReviewAiLabEvalGradeResult {
    /** Aggregated weighted verdict + per-case results for the eval set. */
    grade: GradeEvalSetResult
    /** Model/provider/lane actually used for this grading run. */
    aiUsage: ReviewAiLabEvalAiUsage
}
