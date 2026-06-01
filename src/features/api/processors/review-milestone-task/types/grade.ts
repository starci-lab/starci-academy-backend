import type {
    ProjectEvaluation,
} from "@modules/bullmq"
import type {
    GradingStepAiUsage,
} from "@modules/ai"

/**
 * Review milestone task grade result interface.
 */
export interface ReviewMilestoneTaskGradeResult {
    /** The evaluation result. */
    evaluation: ProjectEvaluation
    /** Whether the task passed. */
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}
