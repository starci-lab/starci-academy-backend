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
    CourseEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class CourseCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) {}

    /**
     * Process the course CDN synchronization.
     */
    private async process() {
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: CourseEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the course CDN synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the course CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.course.interval)
    async handleInterval() {
        await this.process()
    }
}
