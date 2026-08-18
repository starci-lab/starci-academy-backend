/** Configuration parameters for sizing a Bloom filter. */
export interface BloomFilterOptions {
    /**
     * Number of bits in the filter (m).
     * Larger m -> fewer false positives but more memory.
     */
    sizeBits: number
    /**
     * Number of hash functions (k).
     */
    hashes: number
}

/** Serializable state of a Bloom filter: its options plus the raw bitset. */
export interface BloomFilterState extends BloomFilterOptions {
    /**
     * Raw bitset bytes.
     * Length is ceil(sizeBits / 8).
     */
    bytes: Uint8Array
}

/** JSON-friendly export of a {@link BloomFilterState} -- the raw bitset base64-encoded. */
export interface BloomFilterJson extends BloomFilterOptions {
    bytesBase64: string
}
