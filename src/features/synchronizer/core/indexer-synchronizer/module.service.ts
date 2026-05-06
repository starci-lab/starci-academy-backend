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
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ModuleEntity,
} from "@modules/databases"
import {
    envConfig
} from "@modules/env"
import {
    Interval
} from "@nestjs/schedule"
import {
    IndexerSynchronizerService,
} from "./indexer-synchronizer.service"

/**
 * @deprecated Replaced by {@link IndexerSynchronizerService}. Kept for reference.
 */
@Injectable()
export class ModuleIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) { }

    /**
     * Process the module Indexer synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${ModuleEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: ModuleEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${ModuleEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the module Indexer synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ModuleEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the module Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.module.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ModuleEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
