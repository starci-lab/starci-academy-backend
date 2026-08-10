import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link EnvFileConflictException}. */
export interface EnvFileConflictExceptionMetadata extends AbstractExceptionMetadata {
    /** The secret key that was supplied twice. */
    key?: string
    /** The path `<key>_FILE` pointed at. */
    path?: string
}

/**
 * Thrown when a secret is supplied BOTH inline as `<KEY>` and by pointer as
 * `<KEY>_FILE`.
 *
 * Refused rather than resolved on purpose: either precedence rule is
 * defensible and neither is discoverable from the outside, so a silent winner
 * is a stack running on a credential nobody chose. Boot-time only -- it is
 * raised while `envConfig()` is being built, so it never reaches an HTTP
 * boundary and carries no status.
 */
export class EnvFileConflictException extends AbstractException {
    constructor({
        key,
        path,
        originalError,
    }: EnvFileConflictExceptionMetadata) {
        super(
            "Secret supplied both inline and by file pointer.",
            "ENV_FILE_CONFLICT_EXCEPTION",
            {
                key,
                path,
                originalError,
            },
        )
    }
}
