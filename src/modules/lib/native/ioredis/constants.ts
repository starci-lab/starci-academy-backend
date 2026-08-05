export const IOREDIS = "IoRedis"
/**
 * DI token for one IoRedis/Valkey instance. Omitting `key` collides every
 * consumer onto a single client and mixes BullMQ with cache commands.
 */
export const createIoRedisKey = (key?: string) =>
    key ? `${IOREDIS}:${key}` : IOREDIS
