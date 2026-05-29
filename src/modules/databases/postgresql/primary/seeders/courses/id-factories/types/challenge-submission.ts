/**
 * Input for {@link ChallengeSubmissionIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionIdParams {
    /** Locates the parent challenge (same as {@link GenerateChallengeIdParams}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based submission definition from the challenge markdown (`## Submissions` indexed list). */
    submissionIndex: number
}
