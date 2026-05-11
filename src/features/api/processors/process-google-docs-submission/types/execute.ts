import type {
    Document 
} from "@langchain/core/documents"
import {
    EmptyObject 
} from "@modules/common"
/** Result of the process-git-submission load docs step. */
export interface ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult {
    /** Documents loaded from the submitted GitHub repository. */
    docs: Array<Document>
}
/** Result of the process-git-submission split docs step. */
export interface ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult {
    /** Documents split into chunks for embedding. */
    chunks: Array<Document>
}
/** Result of the process-git-submission vectorize step. */
export type ProcessGoogleDocsSubmissionVectorizeStepExecuteResult = EmptyObject

/**
 * Process git submission grade step requirement result.
 */
export interface ProcessGoogleDocsSubmissionGradeStepRequirementResult {
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
    score: number
}

/** Result of the process-git-submission grade step. */
export interface ProcessGoogleDocsSubmissionGradeStepExecuteResult {
    /** Total score from all requirements. */
    totalScore: number
    /** Maximum possible score. */
    maxScore: number
    /** Total requirements passed. */
    passedRequirements: number
    /** Total requirements failed. */
    failedRequirements: number
    /** Requirement feedback array. */
    requirementResults: Array<ProcessGoogleDocsSubmissionGradeStepRequirementResult>
}

/** Result of the process-git-submission complete step. */
export type ProcessGoogleDocsSubmissionCompleteStepExecuteResult = EmptyObject