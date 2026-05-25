import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
} from "@nestjs/common"
import {
    EnqueueSyncEmailBloomFilterJobService,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    BloomFilterSynchronizerService,
} from "./bloom-filter-synchronizer.service"

/**
 * Service for synchronizing the email bloom filters.
 * @deprecated Replaced by {@link BloomFilterSynchronizerService}. Kept for reference.
 */
@Injectable()
export class EmailBloomFiltersSynchronizerService {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncEmailBloomFilterJobService: EnqueueSyncEmailBloomFilterJobService,
    ) { }

    /**
     * Process the email bloom filters.
     */
    async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.BloomFilterSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue Email Bloom Filter sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncEmailBloomFilterJobService.enqueue(
            {
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.BloomFilterSynchronizerEntitiesSyncing,
            {
                dump: "Enqueued Email Bloom Filter sync",
            }
        )
    }
}