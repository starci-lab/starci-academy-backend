import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionPromptEntity,
    CourseEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"

/**
 * Context extension for the Process Google Docs Submission job.
 */
export interface ExtendedProcessGoogleDocsSubmissionContext {
    /** Grading rubric rows from `challenge_submission_prompts`. */
    prompts: Array<ChallengeSubmissionPromptEntity>
    /** Challenge submission requirement. */
    challengeSubmission: ChallengeSubmissionEntity
    /** Parent challenge. */
    challenge: ChallengeEntity
    /** The user submission record. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}