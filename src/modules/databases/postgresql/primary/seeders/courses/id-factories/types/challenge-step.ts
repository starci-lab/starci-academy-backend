/**
 * Input for {@link ChallengeStepIdFactoryService.generate}.
 */
export interface GenerateChallengeStepIdParams {
    /** Locates the parent challenge (same as {@link GenerateChallengeIdParams}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based step from the challenge markdown (`## N. Title` ordering). */
    stepIndex: number
}
