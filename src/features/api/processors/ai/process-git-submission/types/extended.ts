import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"

/** Extended context for the process-git-submission pipeline. */
export interface ExtendedProcessGitSubmissionContext {
    /** Parent challenge (requirements, title, etc.). */
    challenge: ChallengeEntity
    /** Challenge submission. */
    challengeSubmission: ChallengeSubmissionEntity
    /** User challenge submission. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}
