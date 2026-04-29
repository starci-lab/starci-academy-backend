import {
    BloomFilterType,
    CacheKey,
    CacheService 
} from "@modules/cache"
import {
    CacheNotFoundException 
} from "@modules/exceptions"
import {
    Injectable, 
} from "@nestjs/common"

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
     * Add an email to the bloom filter.
     * @param email - The email to add to the bloom filter.
     */
    async add(
        email: string
    ) {
        const bloomFilter = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [
                    BloomFilterType.Email
                ],
            }
        )
        if (!bloomFilter) {
            throw new CacheNotFoundException({
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            })
        }
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
        const bloomFilter = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
        if (!bloomFilter) {
            throw new CacheNotFoundException({
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            })
        }
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
        if (!bloomFilter) {
            throw new CacheNotFoundException({
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            })
        }
        return bloomFilter.scalableBloomFilter.has(email)
    }
}