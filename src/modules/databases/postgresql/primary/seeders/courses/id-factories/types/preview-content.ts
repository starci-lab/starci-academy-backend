/**
 * Input for {@link PreviewContentIdFactoryService.generate}.
 */
export interface GeneratePreviewContentIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based bullet in the module markdown “Preview Contents” list. */
    previewContentIndex: number
}
