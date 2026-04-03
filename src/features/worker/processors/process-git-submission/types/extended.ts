import {
    ChallengePromptEntity,
    ChallengeSubmissionEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"

/** Extended context for the process-git-submission pipeline. */
export interface ExtendedProcessGitSubmissionContext {
    /** Grading rubric rows from `challenge_prompts`. */
    prompts: Array<ChallengePromptEntity>
    /** Challenge submission. */
    challengeSubmission: ChallengeSubmissionEntity
    /** User challenge submission. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}