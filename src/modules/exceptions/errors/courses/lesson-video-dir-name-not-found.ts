import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface LessonVideoDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    lessonVideoIndex: number
}

/**
 * No `{lessonVideoIndex}-*` (or legacy numeric) folder under the module `lession-videos/` directory.
 */
export class LessonVideoDirNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            lessonVideoIndex,
            originalError,
        }: LessonVideoDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Lesson video dir: no mount directory for index ${lessonVideoIndex} (course ${courseIndex}, module ${moduleIndex}, content ${contentIndex})`,
            "LESSON_VIDEO_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                lessonVideoIndex,
                originalError,
            },
        )
    }
}
