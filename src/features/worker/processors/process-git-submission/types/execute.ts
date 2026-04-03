import type {
    Document 
} from "@langchain/core/documents"
import {
    EmptyObject 
} from "@modules/common"
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

/** Result of the process-git-submission grade step. */
export interface ProcessGitSubmissionGradeStepExecuteResult {
    /** Score of the submission. */
    score: number
    /** Feedbacks of the submission. */
    feedbacks: Array<string>
}

/** Result of the process-git-submission complete step. */
export type ProcessGitSubmissionCompleteStepExecuteResult = EmptyObject