import {
    Injectable,
} from "@nestjs/common"
import {
    createHash,
} from "crypto"

export interface BloomFilterOptions {
    /**
     * Number of bits in the filter (m).
     * Larger m → fewer false positives but more memory.
     */
    sizeBits: number
    /**
     * Number of hash functions (k).
     */
    hashes: number
}

export interface BloomFilterState extends BloomFilterOptions {
    /**
     * Raw bitset bytes.
     * Length is ceil(sizeBits / 8).
     */
    bytes: Uint8Array
}

/** Simple Bloom filter helper (in-memory). */
@Injectable()
export class BloomFilterService {
    /**
     * Recommended parameters for a target false positive rate.
     *
     * \( m = -n \ln(p) / (\ln 2)^2 \)
     * \( k = (m/n) \ln 2 \)
     */
    recommend(
        expectedItems: number,
        falsePositiveRate: number = 0.01,
    ): BloomFilterOptions {
        const n = Math.max(
            1,
            Math.floor(expectedItems),
        )
        const p = Math.min(
            0.5,
            Math.max(falsePositiveRate,
                1e-9),
        )
        const ln2 = Math.log(2)
        const m = Math.ceil(-n * Math.log(p) / (ln2 * ln2))
        const k = Math.max(
            1,
            Math.round((m / n) * ln2),
        )
        return {
            sizeBits: m,
            hashes: k,
        }
    }

    /** Create an empty filter state. */
    create(
        options: BloomFilterOptions,
    ): BloomFilterState {
        const sizeBits = Math.max(
            1,
            Math.floor(options.sizeBits),
        )
        const hashes = Math.max(
            1,
            Math.floor(options.hashes),
        )
        const bytes = new Uint8Array(Math.ceil(sizeBits / 8))
        return {
            sizeBits,
            hashes,
            bytes,
        }
    }

    /** Adds one item to the filter. */
    add(
        state: BloomFilterState,
        value: string,
    ): void {
        for (const bitIndex of this.getBitIndexes(state,
            value)) {
            this.setBit(state.bytes,
                bitIndex)
        }
    }

    /** Returns true if the item may exist (false → definitely not). */
    has(
        state: BloomFilterState,
        value: string,
    ): boolean {
        for (const bitIndex of this.getBitIndexes(state,
            value)) {
            if (!this.getBit(state.bytes,
                bitIndex)) return false
        }
        return true
    }

    /** Export filter to JSON-friendly object. */
    toJSON(
        state: BloomFilterState,
    ): {
        sizeBits: number
        hashes: number
        bytesBase64: string
    } {
        return {
            sizeBits: state.sizeBits,
            hashes: state.hashes,
            bytesBase64: Buffer.from(state.bytes).toString("base64"),
        }
    }

    /** Restore filter from JSON-friendly object. */
    fromJSON(
        json: {
            sizeBits: number
            hashes: number
            bytesBase64: string
        },
    ): BloomFilterState {
        const bytes = Uint8Array.from(
            Buffer.from(json.bytesBase64,
                "base64"),
        )
        return {
            sizeBits: json.sizeBits,
            hashes: json.hashes,
            bytes,
        }
    }

    private *getBitIndexes(
        state: BloomFilterState,
        value: string,
    ): Generator<number> {
        const m = state.sizeBits
        const k = state.hashes

        // double hashing: h_i(x) = h1(x) + i*h2(x)
        const digest = createHash("sha256").update(value).digest()
        const h1 = digest.readUInt32LE(0)
        const h2 = digest.readUInt32LE(4) || 0x9e3779b1

        for (let i = 0; i < k; i += 1) {
            const combined = (h1 + i * h2) >>> 0
            yield combined % m
        }
    }

    private setBit(
        bytes: Uint8Array,
        bitIndex: number,
    ): void {
        const byteIndex = Math.floor(bitIndex / 8)
        const mask = 1 << (bitIndex % 8)
        bytes[byteIndex] |= mask
    }

    private getBit(
        bytes: Uint8Array,
        bitIndex: number,
    ): boolean {
        const byteIndex = Math.floor(bitIndex / 8)
        const mask = 1 << (bitIndex % 8)
        return (bytes[byteIndex] & mask) !== 0
    }
}

