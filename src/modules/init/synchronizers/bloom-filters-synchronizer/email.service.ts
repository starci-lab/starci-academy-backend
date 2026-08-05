import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    EnqueueSyncEmailBloomFilterJobService,
} from "@modules/bussiness/jobs/enqueue/sync-email-bloom-filter.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
@Injectable()
/**
 * Service for synchronizing the email bloom filters.
 * @deprecated Replaced by {@link BloomFilterSynchronizerService}. Kept for reference.
 */
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