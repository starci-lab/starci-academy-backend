/**
 * Input for {@link ChallengeSubmissionPromptCriteriaIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionPromptCriteriaIdParams {
    /** Parent course ordinal (same as {@link GenerateChallengeIdParams.courseIndex}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Parent submission ordinal. */
    submissionIndex: number
    /** Parent prompt ordinal. */
    promptIndex: number
    /** Zero-based criteria line in the prompt definition. */
    criteriaIndex: number
}
