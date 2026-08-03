import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    challengeId?: string
}

export class ContentNotFoundException extends AbstractException {
    constructor({
        id,
        challengeId,
        originalError,
    }: ContentNotFoundExceptionMetadata) {
        super(
            "Content not found",
            "CONTENT_NOT_FOUND_EXCEPTION",
            {
                id,
                challengeId,
                originalError,
            },
        )
    }
}
