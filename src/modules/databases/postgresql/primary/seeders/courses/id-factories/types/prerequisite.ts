/**
 * Input for {@link PrerequisiteIdFactoryService.generate}.
 */
export interface GeneratePrerequisiteIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based line in the course “Prerequisites” list. */
    prerequisiteIndex: number
}
