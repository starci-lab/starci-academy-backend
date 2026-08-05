import {
    EmptyObject,
} from "@modules/common"
import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"

/** Result of the process-git-submission grade step. */
export interface ProcessGitSubmissionGradeStepExecuteResult {
    evaluation: ChallengeEvaluation
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}

/** Result of the process-git-submission complete step. */
export type ProcessGitSubmissionCompleteStepExecuteResult = EmptyObject
