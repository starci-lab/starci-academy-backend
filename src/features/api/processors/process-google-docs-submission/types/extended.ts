import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"

/**
 * Context extension for the Process Google Docs Submission job.
 */
export interface ExtendedProcessGoogleDocsSubmissionContext {
    /** Challenge submission requirement. */
    challengeSubmission: ChallengeSubmissionEntity
    /** Parent challenge. */
    challenge: ChallengeEntity
    /** The user submission record. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}