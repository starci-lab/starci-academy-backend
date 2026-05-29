/**
 * Input for {@link ChallengePrerequisiteIdFactoryService.generate}.
 */
export interface GenerateChallengePrerequisiteIdParams {
    /** Parent course ordinal (same as {@link GenerateChallengeIdParams.courseIndex}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based prerequisite line in the challenge markdown. */
    prerequisiteIndex: number
}
