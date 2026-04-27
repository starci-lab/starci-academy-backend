import {
    DayjsService 
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncIndexerJobService 
} from "@modules/bussiness"
import {
    ContentEntity 
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class ContentIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) {}
    
    /**
     * Process the content Indexer synchronization.
     */
    private async process() {
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: ContentEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the content Indexer synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the content Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.content.interval)
    async handleInterval() {
        await this.process()
    }
}