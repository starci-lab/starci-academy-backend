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
    LessonVideoEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class LessonVideoElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the lesson video Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncElasticsearchJobService.enqueue(
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
    @Interval(envConfig().services.elasticsearchSynchronizer.lessonVideo.interval)
    async handleInterval() {
        await this.process()
    }
}
