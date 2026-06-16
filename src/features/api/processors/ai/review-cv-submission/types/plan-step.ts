import type {
    CvAiInvokeDecision,
} from "./decision"
import type {
    ReviewCvSubmissionPlanStepExecuteResult,
} from "./execute"

/**
 * Result of the plan step's internal `execute` phase: the produced execution
 * result plus the AI-invoke decision resolved once here for the analyze step.
 */
export interface ReviewCvSubmissionPlanStepResult {
    /** The execution result (markdown review plan) produced by the plan step. */
    executionResult: ReviewCvSubmissionPlanStepExecuteResult
    /** The AI-invoke decision resolved once in the plan step and reused by analyze. */
    decision: CvAiInvokeDecision
}
