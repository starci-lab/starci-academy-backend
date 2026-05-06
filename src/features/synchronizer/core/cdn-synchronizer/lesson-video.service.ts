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
    LessonVideoEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

/**
 * @deprecated Replaced by {@link CdnSynchronizerService}. Kept for reference.
 */
@Injectable()
export class LessonVideoCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) {}

    /**
     * Process the lesson video CDN synchronization.
     */
    private async process() {
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: LessonVideoEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the lesson video CDN synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the lesson video CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.lessonVideo.interval)
    async handleInterval() {
        await this.process()
    }
}
