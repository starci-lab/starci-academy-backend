import {
    ChallengeSubmissionEntity,
    ChallengeSubmissionPromptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"

/** Extended context for the process-git-submission pipeline. */
export interface ExtendedProcessGitSubmissionContext {
    /** Grading rubric rows from `challenge_submission_prompts`. */
    prompts: Array<ChallengeSubmissionPromptEntity>
    /** Challenge submission. */
    challengeSubmission: ChallengeSubmissionEntity
    /** User challenge submission. */
    userChallengeSubmission: UserChallengeSubmissionEntity
}