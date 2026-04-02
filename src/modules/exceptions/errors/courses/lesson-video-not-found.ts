import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface LessonVideoNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

export class LessonVideoNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: LessonVideoNotFoundExceptionMetadata) {
        super(
            "Lesson video not found",
            "LESSON_VIDEO_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
