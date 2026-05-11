import {
    EmptyObject,
} from "@modules/common"
import type {
    ChallengeEvaluation,
} from "@modules/bullmq"

/** Result of the process-git-submission grade step. */
export interface ProcessGitSubmissionGradeStepExecuteResult {
    evaluation: ChallengeEvaluation
    passed: boolean
}

/** Result of the process-git-submission complete step. */
export type ProcessGitSubmissionCompleteStepExecuteResult = EmptyObject
