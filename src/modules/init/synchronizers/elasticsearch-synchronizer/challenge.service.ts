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
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
/**
 * @deprecated Replaced by {@link ElasticsearchSynchronizerService}. Kept for reference.
 */
export class ChallengeElasticsearchSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncElasticsearchJobService: EnqueueSyncElasticsearchJobService,
    ) {}

    /**
     * Process the challenge Elasticsearch synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${ChallengeEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncElasticsearchJobService.enqueue(
            {
                entityKind: ChallengeEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${ChallengeEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the challenge Elasticsearch synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${ChallengeEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the challenge Elasticsearch synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.elasticsearch.challenge.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitiesSyncing,
            {
                dump: `${ChallengeEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
