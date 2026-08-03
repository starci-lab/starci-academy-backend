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
import type {
    GetEmailBloomFilterResult,
} from "./types"

/**
 * Fast-path, best-effort membership pre-check for known emails, backed by a
 * `ScalableBloomFilter` persisted as one shared cache entry (`CacheKey.BloomFilter`
 * / `BloomFilterType.Email`). Seeded at init by {@link BloomFilterSynchronizerService}
 * and kept warm by the write paths below; the Postgres email-uniqueness
 * constraint remains the actual source of truth — this filter is fail-open,
 * never a hard gate.
 */
@Injectable()
export class EmailBloomFilterService {
    constructor(
        private readonly cacheService: CacheService,
    ) {
    }

    /**
     * Read the raw cached bloom filter entry, without recreating it when absent.
     *
     * @returns The cached filter, or `undefined` when nothing has been cached yet.
     */
    async get(): Promise<GetEmailBloomFilterResult> {
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
    ): Promise<void> {
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
    ): Promise<void> {
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
}