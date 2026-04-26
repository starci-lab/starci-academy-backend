import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable, OnModuleInit 
} from "@nestjs/common"
import {
    EnqueueSyncEmailBloomFilterJobService 
} from "@modules/bussiness"

/**
 * Service for synchronizing the email bloom filter.
 */
@Injectable()
export class EmailSynchronizerService implements OnModuleInit {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncEmailBloomFilterJobService: EnqueueSyncEmailBloomFilterJobService,
    ) {}
    
    /**
     * On module init enqueue a job to sync the email bloom filter.
     */
    async onModuleInit() {
        await this.enqueueSyncEmailBloomFilterJobService.enqueue(
            {
                syncAt: this.dayjsService.now(),
            }
        )
    }
}