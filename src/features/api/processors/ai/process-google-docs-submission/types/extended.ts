import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"

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