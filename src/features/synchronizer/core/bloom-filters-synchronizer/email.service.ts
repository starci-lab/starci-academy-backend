import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable, OnApplicationBootstrap
} from "@nestjs/common"
import {
    EnqueueSyncEmailBloomFilterJobService
} from "@modules/bussiness"
import {
    envConfig
} from "@modules/env"
import {
    Interval
} from "@nestjs/schedule"

/**
 * Service for synchronizing the email bloom filters.
 */
@Injectable()
export class EmailBloomFiltersSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncEmailBloomFilterJobService: EnqueueSyncEmailBloomFilterJobService,
    ) { }

    /**
     * Process the email bloom filters.
     */
    private async process() {
        await this.enqueueSyncEmailBloomFilterJobService.enqueue(
            {
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the email bloom filters.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the email bloom filters synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.emailBloomFilter.interval)
    async handleInterval() {
        await this.process()
    }
}