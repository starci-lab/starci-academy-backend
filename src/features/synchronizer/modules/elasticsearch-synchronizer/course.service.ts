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
    CourseEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class CourseElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the course Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: CourseEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the course Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the course Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.elasticsearchSynchronizer.course.interval)
    async handleInterval() {
        await this.process()
    }
}
