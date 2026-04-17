import {
    CVSubmissionEntity,
    CVPromptEntity,
    UserEntity,
} from "@modules/databases"

/** Extended context for the process-cv-submission pipeline. */
export interface ExtendedProcessCvSubmissionContext {
    /** The CV submission being processed. */
    cvSubmission: CVSubmissionEntity
    /** The user who submitted the CV. */
    user: UserEntity
    /** The prompt template used for analysis. */
    cvPrompt: CVPromptEntity
}
