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
    ElasticsearchSynchronizerService,
} from "./elasticsearch-synchronizer.service"

/**
 * @deprecated Replaced by {@link ElasticsearchSynchronizerService}. Kept for reference.
 */
@Injectable()
export class LessonVideoElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the lesson video Elasticsearch synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${LessonVideoEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: LessonVideoEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${LessonVideoEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the lesson video Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${LessonVideoEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the lesson video Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.elasticsearch.lessonVideo.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${LessonVideoEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
