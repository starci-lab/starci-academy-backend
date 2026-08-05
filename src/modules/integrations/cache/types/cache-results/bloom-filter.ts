import {
    ScalableBloomFilter 
} from "bloom-filters"

/**
 * Cached `ScalableBloomFilter` blob. Callers must round-trip the same instance
 * on write -- replacing it drops previously added members and produces false
 * negatives until the next full sync.
 */
export interface BloomFilterCacheResult {
    /**
     * Bloom filter.
     */
    scalableBloomFilter: ScalableBloomFilter
}