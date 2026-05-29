/**
 * Input for {@link LessonVideoIdFactoryService.generate}.
 */
export interface GenerateLessonVideoIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based video in the content’s `lesson-videos` list. */
    lessonVideoIndex: number
}
