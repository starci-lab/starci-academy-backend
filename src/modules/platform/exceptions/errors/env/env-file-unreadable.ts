import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link EnvFileUnreadableException}. */
export interface EnvFileUnreadableExceptionMetadata extends AbstractExceptionMetadata {
    /** The secret key whose `<key>_FILE` pointer could not be honoured. */
    key?: string
    /** The path `<key>_FILE` pointed at. */
    path?: string
}

/**
 * Thrown when `<KEY>_FILE` is set but the file behind it is missing, unreadable
 * or empty.
 *
 * A pointer that exists and cannot be read is a HARD FAILURE, not a fall-back
 * to the default. The pointer is GENERATED rather than hand-written, so a
 * pointer present means somebody deliberately put a file behind it; an
 * unreadable one is a secret declared and never created, a mount that did not
 * happen, or a name that drifted -- each of which otherwise produces a deploy
 * that goes green while the app quietly runs without a credential it was given.
 *
 * The optional case stays free: leave `<KEY>_FILE` unset and the default
 * applies exactly as before.
 */
export class EnvFileUnreadableException extends AbstractException {
    constructor({
        key,
        path,
        originalError,
    }: EnvFileUnreadableExceptionMetadata) {
        super(
            "Secret file pointer is set but the file is unreadable or empty.",
            "ENV_FILE_UNREADABLE_EXCEPTION",
            {
                key,
                path,
                originalError,
            },
        )
    }
}
