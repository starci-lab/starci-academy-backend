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
    CourseEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
export class CourseIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) {}

    /**
     * Process the course Elasticsearch synchronization.
     */
    private async process() {
        await this.enqueueSyncIndexerJobService.enqueue(
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
     * Handle the course Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.course.interval)
    async handleInterval() {
        await this.process()
    }
}
