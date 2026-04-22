/**
 * Enum of cache key names used for Redis/memory cache entries.
 * Each key corresponds to a cache namespace and its result type.
 */
export enum CacheKey {
    NatsMessageDigest = "nats.message.digest",
}
