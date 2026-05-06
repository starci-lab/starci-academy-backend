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
    ContentEntity,
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
export class ContentIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) { }

    /**
     * Process the content Indexer synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${ContentEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: ContentEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${ContentEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the content Indexer synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ContentEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the content Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.content.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ContentEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
