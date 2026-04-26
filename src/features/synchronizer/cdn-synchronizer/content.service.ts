import {
    DayjsService 
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncCdnJobService 
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
export class ContentCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) {}
    
    /**
     * Process the content CDN synchronization.
     */
    private async process() {
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: ContentEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the content CDN synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the content CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.content.interval)
    async handleInterval() {
        await this.process()
    }
}