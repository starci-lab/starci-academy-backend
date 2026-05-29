import {
    CacheKey,
} from "../enums"

/**
 * Configuration for the GraphQL cache interceptor.
 */
export interface GraphQLCacheConfig {
    /** Cache key enum to use. */
    key: CacheKey
    /**
     * Extracts the cache arguments from the GraphQL resolver arguments.
     * Receives the `request` arg object and the authenticated `user` object.
     * Must return a stable array of primitives used to build the composite cache key.
     *
     * @example
     * argsExtractor: (request, user) => [request.courseId, user?.id]
     */
    argsExtractor: (request: any, user: any) => Array<any>
}
