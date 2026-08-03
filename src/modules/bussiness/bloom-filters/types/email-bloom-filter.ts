import type {
    BloomFilterCacheResult,
} from "@modules/cache"

/**
 * Result of {@link EmailBloomFilterService.get}: the cached email bloom
 * filter, or `undefined` when nothing has been cached yet (before init /
 * after a Redis flush — {@link EmailBloomFilterService.loadOrCreate} is what
 * recreates it on the write path).
 */
export type GetEmailBloomFilterResult = BloomFilterCacheResult | undefined
