import {
    CVSubmissionEntity,
} from "@modules/databases"

/** Result of the CV extraction step. */
export interface ProcessCvSubmissionExtractStepExecuteResult {
    /** The extracted text. */
    originalText: string
}

/** Result of the CV analysis step. */
export interface ProcessCvSubmissionAnalyzeStepExecuteResult {
    /** The updated CV submission entity (partial). */
    cvSubmission: Partial<CVSubmissionEntity>
}
