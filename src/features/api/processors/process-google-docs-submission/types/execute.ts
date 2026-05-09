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

/** Result of the process-git-submission grade step. */
export interface ProcessGoogleDocsSubmissionGradeStepExecuteResult {
    /** Score of the submission. */
    score: number
    /** Feedbacks of the submission. */
    feedbacks: Array<string>
}

/** Result of the process-git-submission complete step. */
export type ProcessGoogleDocsSubmissionCompleteStepExecuteResult = EmptyObject