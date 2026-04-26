import {
    Injectable, OnModuleInit
} from "@nestjs/common"
import {
    BloomFilter 
} from "bloom-filters"
import {
    InjectIoRedis, 
    IoRedisInstanceKey
} from "@modules/native"
import type {
    RedisOrCluster 
} from "@modules/native"
import {
    CacheKey,
    CacheService 
} from "@modules/cache"
import { 
    InjectPrimaryPostgreSQLEntityManager, 
    UserEntity
} from "@modules/databases"
import { 
    EntityManager 
} from "typeorm"

/**
 * Service for creating and managing Bloom filters.
 */
@Injectable()
export class EmailBloomFilterService implements OnModuleInit {
    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: RedisOrCluster,
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    async onModuleInit() {
        const bloomFilterKey = this.cacheService.getCacheKey(
            CacheKey.EmailBloomFilter
        )
        //check if the bloom filter exists
        const bloomFilter = await this.redis.get(bloomFilterKey)
        if (!bloomFilter) {
            const bloomFilter = new BloomFilter(
                10_000, //10,000 users
                0.001  //0.1% false positive rate
            )
            await this.redis.set(bloomFilterKey, bloomFilter.toJSON())
        }
    }
}