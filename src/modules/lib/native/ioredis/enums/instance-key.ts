/** IoRedis/Valkey instance key. */
export enum IoRedisInstanceKey {
    /** Dedicated queue Redis -- `maxRetriesPerRequest: null`; sharing cache would break BullMQ blocking commands. */
    BullMQ = "bullmq",
    /** Isolated rate-limit counters so cache TTL / queue traffic cannot evict throttle state. */
    Throttler = "throttler",
    /** Socket.IO adapter pub/sub -- separate so fan-out is not stalled by queue or cache. */
    Adapter = "adapter",
    /** Valkey cache store -- eviction here must not wipe queue or throttle keys. */
    Cache = "cache",
}
