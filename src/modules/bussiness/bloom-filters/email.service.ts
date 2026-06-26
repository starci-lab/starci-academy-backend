import {
    BloomFilterType,
    CacheKey,
    CacheService
} from "@modules/cache"
import type {
    BloomFilterCacheResult,
} from "@modules/cache"
import {
    Injectable,
} from "@nestjs/common"
import {
    ScalableBloomFilter,
} from "bloom-filters"

@Injectable()
export class EmailBloomFilterService {
    constructor(
        private readonly cacheService: CacheService,
    ) {
    }

    /**
     * Get the bloom filter.
     * @returns The bloom filter.
     */
    async get() {
        return await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
    }

    /**
     * Load the email bloom filter, lazily recreating it empty when missing.
     *
     * The filter is an ephemeral, best-effort dedup cache seeded during init
     * ({@link BloomFilterSynchronizerService}). If init has not run yet or Redis
     * was flushed, the key is absent — recreating it empty here keeps write paths
     * (account creation, OTP sign-up) from hard-failing with a
     * `CACHE_NOT_FOUND_EXCEPTION`. The database email-uniqueness constraint stays
     * the source of truth, so an empty filter is safe (it only loses fast-path
     * dedup until the next full sync).
     *
     * @returns The cached (or freshly created + persisted) bloom filter result.
     */
    private async loadOrCreate(): Promise<BloomFilterCacheResult> {
        const cached = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
        if (cached?.scalableBloomFilter) {
            return cached
        }
        const scalableBloomFilter = new ScalableBloomFilter()
        await this.cacheService.set(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
                cacheResult: {
                    scalableBloomFilter,
                },
            }
        )
        return {
            scalableBloomFilter,
        }
    }

    /**
     * Add an email to the bloom filter.
     * @param email - The email to add to the bloom filter.
     */
    async add(
        email: string
    ) {
        const bloomFilter = await this.loadOrCreate()
        bloomFilter.scalableBloomFilter.add(
            email
        )
        await this.cacheService.set(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
                cacheResult: {
                    scalableBloomFilter: bloomFilter.scalableBloomFilter,
                },
            }
        )
    }

    /**
     * Add multiple emails to the bloom filter.
     * @param emails - The emails to add to the bloom filter.
     */
    async addMultiple(
        emails: Array<string>
    ) {
        const bloomFilter = await this.loadOrCreate()
        for (const email of emails) {
            bloomFilter.scalableBloomFilter.add(email)
        }
        await this.cacheService.set(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
                cacheResult: {
                    scalableBloomFilter: bloomFilter.scalableBloomFilter,
                },
            }
        )
    }

    /**
     * Check if an email is in the bloom filter.
     *
     * Read-only: when the filter is absent (never seeded / evicted) this returns
     * `false` rather than throwing — "not seen" is the safe answer for a
     * best-effort dedup pre-check, and callers fall back to the database.
     *
     * @param email - The email to check.
     * @returns True if the email is in the bloom filter, false otherwise.
     */
    async has(
        email: string
    ) {
        const bloomFilter = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
        if (!bloomFilter?.scalableBloomFilter) {
            return false
        }
        return bloomFilter.scalableBloomFilter.has(email)
    }
}