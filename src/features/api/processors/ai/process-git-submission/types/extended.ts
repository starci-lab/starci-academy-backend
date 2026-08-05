import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"

/** Extended context for the process-git-submission pipeline. */
export interface ExtendedProcessGitSubmissionContext {
    /** Parent challenge (requirements, title, etc.). */
    challenge: ChallengeEntity
    /** Challenge submission. */
    challengeSubmission: ChallengeSubmissionEntity
    /** User challenge submission. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}
