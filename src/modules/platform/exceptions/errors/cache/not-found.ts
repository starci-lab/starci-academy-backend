import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

/** Cache key + lookup args for a miss the caller treated as required. */
export interface CacheNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    key: string
    args: Array<string>
}
/**
 * Signals a required cache entry is absent — caller must recompute rather than read
 * undefined.
 */
export class CacheNotFoundException extends AbstractException {
    constructor(
        { key, args, originalError }: CacheNotFoundExceptionMetadata
    ) {
        super("Cache not found",
            "CACHE_NOT_FOUND_EXCEPTION",
            {
                key,
                args,
                originalError,
            }
        )
    }
}