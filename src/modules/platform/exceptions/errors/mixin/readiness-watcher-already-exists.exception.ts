import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a readiness watcher registered under an already-used name. */
export interface ReadinessWatcherAlreadyExistsExceptionMetadata extends AbstractExceptionMetadata {
    /** The watcher name that was already registered. */
    name: string
}

/**
 * Thrown when {@link ReadinessWatcherFactoryService} is asked to create a
 * watcher under a name that already has one registered.
 */
export class ReadinessWatcherAlreadyExistsException extends AbstractException {
    constructor({
        name,
        originalError,
    }: ReadinessWatcherAlreadyExistsExceptionMetadata) {
        super(
            "Readiness watcher already exists.",
            "READINESS_WATCHER_ALREADY_EXISTS_EXCEPTION",
            {
                name,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
