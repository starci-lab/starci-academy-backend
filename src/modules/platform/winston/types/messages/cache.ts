import type {
    CacheType,
} from "@modules/integrations/cache/enums/cache-type"

/**
 * Structured fields when a cache GET throws -- key + backend so ops can tell Redis vs
 * memory.
 */
export interface ErrorGettingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

/**
 * Structured fields when a cache SET throws -- write path failed, callers may still
 * continue uncached.
 */
export interface ErrorSettingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

/** Structured fields when a cache DEL throws -- stale entries may linger until TTL. */
export interface ErrorDeletingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

/**
 * Round-trip probe succeeded against Redis -- balancer/debug route can report the backend
 * is live.
 */
export interface CacheDebugOkRedisMessage {
    randomString: string
}

/** Round-trip probe succeeded against in-process memory cache. */
export interface CacheDebugOkMemoryMessage {
    randomString: string
}

