import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncIndexerJobService,
} from "@modules/bussiness/jobs/enqueue/sync-indexer.service"
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
 * @deprecated Replaced by {@link IndexerSynchronizerService}. Kept for reference.
 */
export class CourseIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) {}

    /**
     * Process the course Indexer synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${CourseEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: CourseEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${CourseEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the course Indexer synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${CourseEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the course Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.course.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${CourseEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
