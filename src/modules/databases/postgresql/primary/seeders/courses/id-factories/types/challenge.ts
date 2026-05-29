/**
 * Input for {@link ChallengeIdFactoryService.generate}.
 */
export interface GenerateChallengeIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based challenge folder under `modules/{m}/contents/{c}/challenges/{challengeIndex}`. */
    challengeIndex: number
}
