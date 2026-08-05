import type {
    ProjectEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/project-evaluation"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"

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
