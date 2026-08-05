import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncCdnJobService,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    CourseEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
/**
 * @deprecated Replaced by {@link CdnSynchronizerService}. Kept for reference.
 */
export class CourseCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) {}

    /**
     * Process the course CDN synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `Enqueue ${CourseEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: CourseEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `Enqueued ${CourseEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the course CDN synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `${CourseEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the course CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.course.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `${CourseEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
