/**
 * Input for {@link ChallengeReferenceIdFactoryService.generate}.
 */
export interface GenerateChallengeReferenceIdParams {
    /** Locates the parent challenge (same as {@link GenerateChallengeIdParams}). */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Zero-based reference from the challenge markdown (`## References` indexed list). */
    referenceIndex: number
}
