/**
 * GraphQL execution context exposing only the header bag off the underlying
 * request -- narrower than the full Express `Request` because these guards
 * read exactly one header and nothing else.
 */
export interface GraphQLHeaderOnlyContext {
    /** The underlying request, when the transport provides one. */
    req?: {
        /** Raw header bag (array-valued when a header repeats). */
        headers?: Record<string, string | Array<string> | undefined>
    }
}
