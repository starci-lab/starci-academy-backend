import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncIndexerJobService,
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
export class ModuleIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) {}

    /**
     * Process the module Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: ModuleEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the module Indexer synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the module Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.module.interval)
    async handleInterval() {
        await this.process()
    }
}
