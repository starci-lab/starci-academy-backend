import type {
    ProjectEvaluation,
} from "@modules/bullmq"

/**
 * Review milestone task grade result interface.
 */
export interface ReviewMilestoneTaskGradeResult {
    /** The evaluation result. */
    evaluation: ProjectEvaluation
    /** Whether the task passed. */
    passed: boolean
}
