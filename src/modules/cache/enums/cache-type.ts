/** Backend used for cache (Redis = shared, Memory = process-local). */
export enum CacheType {
    /** Memory cache. */
    Memory = "memory",
    /** Redis cache. */
    Redis = "redis",
}
