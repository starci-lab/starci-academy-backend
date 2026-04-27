import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    challengeId?: string
    lessonVideoId?: string
}

export class ContentNotFoundException extends AbstractException {
    constructor({
        id,
        challengeId,
        lessonVideoId,
        originalError,
    }: ContentNotFoundExceptionMetadata) {
        super(
            "Content not found",
            "CONTENT_NOT_FOUND_EXCEPTION",
            {
                id,
                challengeId,
                lessonVideoId,
                originalError,
            },
        )
    }
}
