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
export interface ProcessGitSubmissionGradeStepExecuteResult {
    /** Score of the submission. */
    score: number
    /** One short feedback sentence (stored in `user_challenge_submissions.feedback`). */
    shortFeedback: string | null
    /** Structured feedback rows (stored in `submission_feedbacks`). */
    submissionFeedbacks: Array<ProcessGitSubmissionGradeStepSubmissionFeedback>
}

/** Result of the process-git-submission complete step. */
export type ProcessGitSubmissionCompleteStepExecuteResult = EmptyObject