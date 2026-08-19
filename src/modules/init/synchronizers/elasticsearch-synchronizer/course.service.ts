import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncElasticsearchJobService,
} from "@modules/bussiness/jobs/enqueue/sync-elasticsearch.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Interval
} from "@nestjs/schedule"

@Injectable()
/**
 * @deprecated Replaced by {@link ElasticsearchSynchronizerService}. Per-course
 * interval enqueue kept for reference; not registered on
 * {@link ElasticsearchSynchronizerModule}.
 */
export class CourseElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the course Elasticsearch synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${CourseEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: CourseEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${CourseEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the course Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${CourseEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the course Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.elasticsearch.course.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${CourseEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
