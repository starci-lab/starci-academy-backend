/** Redis instance key. */
export enum RedisInstanceKey {
    /** Cache store -- eviction here must not wipe queue or throttle keys. */
    Cache = "cache",
    /** Dedicated queue Redis; sharing cache would interleave blocking job commands with GET/SET. */
    BullMQ = "bullmq",
    /** Isolated rate-limit counters so cache TTL / queue traffic cannot evict throttle state. */
    Throttler = "throttler",
    /** Socket.IO adapter pub/sub -- separate so fan-out is not stalled by queue or cache. */
    Adapter = "adapter",
}
