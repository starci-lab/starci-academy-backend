export const REDIS = "Redis"
/**
 * DI token for one node-redis client. Omitting `key` collapses every role onto
 * one connection and mixes cache commands with adapter pub/sub.
 */
export const createRedisKey = (key?: string) =>
    key ? `${REDIS}:${key}` : REDIS
