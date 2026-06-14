import {
    EmptyObject,
} from "@modules/common"
import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import type {
    GradingStepAiUsage,
} from "@modules/ai"

/** Result of the process-google-docs-submission grade step. */
export interface ProcessGoogleDocsSubmissionGradeStepExecuteResult {
    evaluation: ChallengeEvaluation
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}

/** Result of the process-google-docs-submission complete step. */
export type ProcessGoogleDocsSubmissionCompleteStepExecuteResult = EmptyObject
