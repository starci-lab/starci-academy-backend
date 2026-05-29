import type {
    CacheKey,
    CacheType,
} from "../enums"
import {
    configMap
} from "../constants/config"

/** Params for cache get (key, optional args, cache type). */
export interface GetParams<K extends CacheKey> {
    /** The cache key enum identifying the cached entry. */
    key: K
    /** Dynamic segments folded into the composite cache key. */
    args?: Array<unknown>
    /** Optional cache backend (e.g. memory or Redis) to read from. */
    cacheType?: CacheType
}

/** Params for cache set (key, args, cache result, cache type). */
export interface SetParams<K extends CacheKey> {
    /** The cache key enum identifying the cached entry. */
    key: K
    /** Dynamic segments folded into the composite cache key. */
    args?: Array<unknown>
    /** The value to store, typed per the cache config map for this key. */
    cacheResult: typeof configMap[K]["cacheResult"]
    /** Optional cache backend (e.g. memory or Redis) to write to. */
    cacheType?: CacheType
}

/** Params for cache delete (key, optional args, cache type). */
export interface DelParams {
    /** The cache key enum identifying the entry to delete. */
    key: CacheKey
    /** Dynamic segments folded into the composite cache key. */
    args?: Array<unknown>
    /** Optional cache backend (e.g. memory or Redis) to delete from. */
    cacheType?: CacheType
}
