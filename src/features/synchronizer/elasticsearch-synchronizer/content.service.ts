import {
    DayjsService 
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncElasticsearchJobService 
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
export class ContentElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}
    
    /**
     * Process the content Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: ContentEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the content Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the content Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.elasticsearchSynchronizer.content.interval)
    async handleInterval() {
        await this.process()
    }
}