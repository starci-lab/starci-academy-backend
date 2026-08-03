import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a readiness-watcher operation against an unregistered name. */
export interface ReadinessWatcherNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The watcher name looked up. */
    name: string
}

/**
 * Thrown when {@link ReadinessWatcherFactoryService.wait}/`setReady`/`setErrored`
 * targets a watcher name that was never registered.
 */
export class ReadinessWatcherNotFoundException extends AbstractException {
    constructor({
        name,
        originalError,
    }: ReadinessWatcherNotFoundExceptionMetadata) {
        super(
            "Readiness watcher not found.",
            "READINESS_WATCHER_NOT_FOUND_EXCEPTION",
            {
                name,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
