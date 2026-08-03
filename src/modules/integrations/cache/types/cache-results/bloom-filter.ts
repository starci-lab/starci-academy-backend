import {
    ScalableBloomFilter 
} from "bloom-filters"

export interface BloomFilterCacheResult {
    /**
     * Bloom filter.
     */
    scalableBloomFilter: ScalableBloomFilter
}