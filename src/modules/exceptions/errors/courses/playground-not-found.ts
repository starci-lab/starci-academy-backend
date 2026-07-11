import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a playground does not exist. */
export interface PlaygroundNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    slug?: string
}

/** Thrown when no playground matches the requested id/slug. */
export class PlaygroundNotFoundException extends AbstractException {
    constructor({
        id,
        slug,
        originalError,
    }: PlaygroundNotFoundExceptionMetadata) {
        super(
            "Playground not found",
            "PLAYGROUND_NOT_FOUND_EXCEPTION",
            {
                id,
                slug,
                originalError,
            },
        )
    }
}
