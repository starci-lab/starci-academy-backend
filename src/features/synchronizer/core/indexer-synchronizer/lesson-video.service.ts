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
    LessonVideoEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class LessonVideoIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) {}

    /**
     * Process the lesson video Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: LessonVideoEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the lesson video Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the lesson video Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.lessonVideo.interval)
    async handleInterval() {
        await this.process()
    }
}
