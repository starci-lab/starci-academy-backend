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
    LessonVideoEntity,
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
export class LessonVideoIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) { }

    /**
     * Process the lesson video Indexer synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${LessonVideoEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: LessonVideoEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${LessonVideoEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the lesson video Indexer synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${LessonVideoEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the lesson video Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.lessonVideo.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${LessonVideoEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
