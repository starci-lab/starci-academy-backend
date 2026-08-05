import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import type {
    ChallengeEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/challenge-evaluation"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"

/** Result of the process-google-docs-submission grade step. */
export interface ProcessGoogleDocsSubmissionGradeStepExecuteResult {
    evaluation: ChallengeEvaluation
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}

/** Result of the process-google-docs-submission complete step. */
export type ProcessGoogleDocsSubmissionCompleteStepExecuteResult = EmptyObject
