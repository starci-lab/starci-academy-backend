import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncElasticsearchJobService,
} from "@modules/bussiness"
import {
    ModuleEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class ModuleElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the module Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: ModuleEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the module Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the module Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.elasticsearchSynchronizer.module.interval)
    async handleInterval() {
        await this.process()
    }
}
