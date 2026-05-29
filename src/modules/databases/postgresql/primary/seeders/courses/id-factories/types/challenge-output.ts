/**
 * Input for {@link ChallengeOutputIdFactoryService.generate}.
 */
export interface GenerateChallengeOutputIdParams {
    /** Parent course ordinal (same as {@link GenerateChallengeIdParams.courseIndex}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based output line in the challenge markdown. */
    outputIndex: number
}
