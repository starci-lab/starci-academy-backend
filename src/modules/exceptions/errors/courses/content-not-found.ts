import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

export class ContentNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: ContentNotFoundExceptionMetadata) {
        super(
            "Content not found",
            "CONTENT_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
