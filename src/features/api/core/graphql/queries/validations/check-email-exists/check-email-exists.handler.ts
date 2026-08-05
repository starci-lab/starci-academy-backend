import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    BloomFilterType,
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    CheckEmailExistsQuery,
} from "./check-email-exists.query"
import type {
    CheckEmailExistsData,
} from "./graphql-types"

@QueryHandler(CheckEmailExistsQuery)
@Injectable()
/**
 * Bloom-filter email probe for signup / validation UIs. Never hits the
 * users table -- a cache miss or empty input returns `exists: false` with
 * `isBloomFilterReady: false` so the client can fall back rather than
 * assume the address is free.
 */
export class CheckEmailExistsHandler
    extends ICQRSHandler<CheckEmailExistsQuery, CheckEmailExistsData>
    implements IQueryHandler<CheckEmailExistsQuery, CheckEmailExistsData>
{
    constructor(
        private readonly cacheService: CacheService,
    ) {
        super()
    }

    protected override async process(
        query: CheckEmailExistsQuery,
    ): Promise<CheckEmailExistsData> {
        const {
            request: {
                email,
            },
        } = query.params

        const normalizedEmail = email?.trim().toLowerCase()
        if (!normalizedEmail) {
            return {
                exists: false,
                isBloomFilterReady: false,
            }
        }

        const cached = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            },
        )

        if (!cached?.scalableBloomFilter) {
            return {
                exists: false,
                isBloomFilterReady: false,
            }
        }

        return {
            exists: cached.scalableBloomFilter.has(normalizedEmail),
            isBloomFilterReady: true,
        }
    }
}

