/**
 * Input for {@link ChallengeRequirementIdFactoryService.generate}.
 */
export interface GenerateChallengeRequirementIdParams {
    /** Parent course ordinal (same as {@link GenerateChallengeIdParams.courseIndex}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based requirement line in the challenge markdown. */
    requirementIndex: number
}
