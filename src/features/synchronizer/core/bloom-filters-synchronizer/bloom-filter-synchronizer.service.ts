import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    type EntityManager,
    MoreThan,
} from "typeorm"
import {
    EmailBloomFilterService,
} from "@modules/bussiness"
import {
    BloomFilterType,
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    ScalableBloomFilter,
} from "bloom-filters"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"

/**
 * Email bloom filter synchronizer — creates bloom filter and batch-adds all user emails.
 */
@Injectable()
export class BloomFilterSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly emailBloomFilterService: EmailBloomFilterService,
        private readonly cacheService: CacheService,
        private readonly retryService: RetryService,
    ) { }

    /**
     * Sync email bloom filter: ensure filter exists + batch-add all user emails.
     */
    async sync(): Promise<void> {
        /**
         * Start the bloom filter synchronization.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.BloomFilterSynchronizerSyncStarted,
            {
                startedAt: start,
            }
        )

        // 1. Ensure bloom filter exists in cache
        const cached = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
        if (!cached) {
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
            this.winstonService.log(
                WinstonLog.BloomFilterSynchronizerFilterCreated,
                {
                    filterType: BloomFilterType.Email,
                }
            )
        } else {
            this.winstonService.log(
                WinstonLog.BloomFilterSynchronizerFilterAlreadyExists,
                {
                    filterType: BloomFilterType.Email,
                }
            )
        }

        // 2. Batch-add all user emails
        const batchSize = envConfig().services.synchronizer.emailBloomFilter.process.batchSize
        let resumeAfterId: string | null = null
        let totalEmails = 0

         
        while (true) {
            const users = await this.entityManager.find(
                UserEntity,
                {
                    where: {
                        ...(resumeAfterId ? {
                            id: MoreThan(resumeAfterId),
                        } : {
                        }),
                    },
                    order: {
                        id: "ASC",
                    },
                    take: batchSize,
                },
            )
            if (users.length === 0) {
                break
            }
            try {
                await this.retryService.retry({
                    action: () => this.emailBloomFilterService.addMultiple(
                        users.map((user) => user.email ?? ""),
                    ),
                })
                totalEmails += users.length
                resumeAfterId = users[users.length - 1]?.id ?? null
            } catch (error) {
                this.winstonService.log(
                    WinstonLog.BloomFilterSynchronizerEntitySyncFailed,
                    {
                        entityKind: "UserEmail",
                        entityId: resumeAfterId ?? "unknown",
                        error: (error as Error).message,
                    }
                )
                // Skip this batch and continue with the next
                resumeAfterId = users[users.length - 1]?.id ?? null
            }
        }

        this.winstonService.log(
            WinstonLog.BloomFilterSynchronizerEmailsSynced,
            {
                totalEmails,
            }
        )
        /**
         * End the bloom filter synchronization.
         */
        this.winstonService.log(
            WinstonLog.BloomFilterSynchronizerSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
