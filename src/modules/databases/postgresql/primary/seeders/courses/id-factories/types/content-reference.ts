/**
 * Input for {@link ContentReferenceIdFactoryService.generate}.
 */
export interface GenerateContentReferenceIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based reference line in the content’s References block. */
    referenceIndex: number
}
