/**
 * Base abstract exception class for all custom exceptions
 * All exceptions in the application should extend this class
 */
export class AbstractException extends Error {
    /** Unique error code for identification */
    readonly code: string
    /** Additional metadata for debugging */
    readonly metadata?: Record<string, unknown>
    /**
     * Optional HTTP status this exception should map to when it crosses a
     * REST boundary (via {@link AbstractExceptionHttpFilter}). Undefined ->
     * the filter defaults to 500 -- most domain exceptions don't set this;
     * it exists for cases (guards, auth) that need to preserve a specific
     * status code (401/403/404/400) instead of the generic default.
     */
    readonly httpStatus?: number

    /**
         * @param message Human readable message
         * @param name Exception code (kept as `Error.name` for backward compatibility)
         * @param metadata Extra debugging metadata
         * @param httpStatus Optional HTTP status override for REST responses (defaults to 500 when omitted)
         */
    constructor(message: string, name: string, metadata?: Record<string, unknown>, httpStatus?: number) {
        super(message)
        this.code = name
        this.name = name
        this.metadata = metadata
        this.httpStatus = httpStatus
    }

    /**
     * Convert the exception to a JSON string.
     * @returns The JSON string.
     */
    toJSON(): string {
        return JSON.stringify(
            {
                message: this.message,
                code: this.code,
                metadata: this.metadata,
            }
        )
    }
    /**
     * Create an exception from a JSON string.
     * @param json - The JSON string.
     * @returns The exception.
     */
    static fromJSON<T extends AbstractException>(
        this: new (
          message: string,
          code: string,
          metadata?: Record<string, unknown>
        ) => T,
        json: string,
    ): T {
        const { message, code, metadata } = JSON.parse(json)
        return new this(message,
            code,
            metadata)
    }
    /**
     * Get the original error from the exception.
     * @returns The original error.
     */
    getOriginalError(): Error {
        return this.metadata?.originalError as Error
    }
}


/** Additional metadata for exception instances (e.g. originalError). */
export interface AbstractExceptionMetadata {
    originalError?: Error
}