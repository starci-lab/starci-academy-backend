import type {
    CacheType,
} from "@modules/cache"

export interface ErrorGettingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

export interface ErrorSettingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

export interface ErrorDeletingCacheMessage {
    error: string
    cacheKey: string
    cacheType: CacheType
}

export interface CacheDebugOkRedisMessage {
    randomString: string
}

export interface CacheDebugOkMemoryMessage {
    randomString: string
}

