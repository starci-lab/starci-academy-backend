import {
    EmptyObject,
} from "@modules/common"
import type {
    ChallengeEvaluation,
} from "@modules/bullmq"

/** Result of the process-google-docs-submission grade step. */
export interface ProcessGoogleDocsSubmissionGradeStepExecuteResult {
    evaluation: ChallengeEvaluation
    passed: boolean
}

/** Result of the process-google-docs-submission complete step. */
export type ProcessGoogleDocsSubmissionCompleteStepExecuteResult = EmptyObject
