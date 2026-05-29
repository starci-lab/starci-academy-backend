/**
 * Input for {@link ContentIdFactoryService.generate}.
 */
export interface GenerateContentIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based content slot under `modules/{moduleIndex}/contents/{contentIndex}`. */
    contentIndex: number
}
