import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface LessonVideoPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    lessonVideoIndex: number
}

/**
 * No lesson-video path is available in the resolved `paths` list for the given index.
 */
export class LessonVideoPathNotFoundException extends AbstractException {
    constructor(
        {
            lessonVideoIndex,
            originalError,
        }: LessonVideoPathNotFoundExceptionMetadata,
    ) {
        super(
            `Lesson video path not found for index ${lessonVideoIndex}`,
            "LESSON_VIDEO_PATH_NOT_FOUND_EXCEPTION",
            {
                lessonVideoIndex,
                originalError,
            },
        )
    }
}
