import {
    Inject 
} from "@nestjs/common"
import {
    MEMORY_CACHE_MANAGER,
    REDIS_CACHE_MANAGER
} from "./constants"

/** Shared Redis cache — use for values that must be visible across pods. */
export const InjectRedisCache = (): ReturnType<typeof Inject> =>
    Inject(REDIS_CACHE_MANAGER)

/** Process-local memory cache — use only when cross-pod sharing would be wrong (e.g. NATS digest). */
export const InjectMemoryCache = (): ReturnType<typeof Inject> =>
    Inject(MEMORY_CACHE_MANAGER)
