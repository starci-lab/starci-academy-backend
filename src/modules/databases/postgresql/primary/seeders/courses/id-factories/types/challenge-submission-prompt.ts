/**
 * Input for {@link ChallengeSubmissionPromptIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionPromptIdParams {
    /** Locates the parent submission (same as {@link GenerateChallengeSubmissionIdParams}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Parent submission ordinal. */
    submissionIndex: number
    /** Zero-based prompt in the submission definition list. */
    promptIndex: number
}
