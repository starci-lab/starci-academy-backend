import type {
    Document 
} from "@langchain/core/documents"
import {
    EmptyObject 
} from "@modules/common"
import {
    SubmissionFeedbackSeverity,
} from "@modules/databases/postgresql/primary/enums"
/** Result of the process-git-submission load docs step. */
export interface ProcessGitSubmissionLoadDocsStepExecuteResult {
    /** Documents loaded from the submitted GitHub repository. */
    docs: Array<Document>
}
/** Result of the process-git-submission split docs step. */
export interface ProcessGitSubmissionSplitDocsStepExecuteResult {
    /** Documents split into chunks for embedding. */
    chunks: Array<Document>
}
/** Result of the process-git-submission vectorize step. */
export type ProcessGitSubmissionVectorizeStepExecuteResult = EmptyObject

/** Result of the process-git-submission grade step (load → split → vectorize → LLM grade). */
export interface ProcessGitSubmissionGradeStepSubmissionFeedback {
    message: string
    detail?: string
    severity?: SubmissionFeedbackSeverity
    location?: string
    suggestion?: string
}

/**
 * Process git submission grade step requirement result.
 */
export interface ProcessGitSubmissionGradeStepRequirementResult {
    /** Requirement ID */
    requirementId: string
    /** Whether the requirement was passed */
    passed: boolean
    /** Feedback for the requirement */
    feedback: string
    /** Location of the feedback */
    location: string | null
    /** Suggestion for the requirement */
    suggestion: string | null
    /** Score for the requirement */
    score: number
}

export interface ProcessGitSubmissionGradeStepExecuteResult {
    /** Total score from all requirements. */
    totalScore: number
    /** Maximum possible score. */
    maxScore: number
    /** Total requirements passed. */
    passedRequirements: number
    /** Total requirements failed. */
    failedRequirements: number
    /** Requirement feedback array. */
    requirementResults: Array<ProcessGitSubmissionGradeStepRequirementResult>
}

/** Result of the process-git-submission complete step. */
export type ProcessGitSubmissionCompleteStepExecuteResult = EmptyObject