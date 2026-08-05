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
 * @deprecated Replaced by {@link IndexerSynchronizerService}. Kept for reference.
 */
export class ChallengeIndexerSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncIndexerJobService: EnqueueSyncIndexerJobService,
    ) { }

    /**
     * Process the challenge Indexer synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueue ${ChallengeEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncIndexerJobService.enqueue(
            {
                entityKind: ChallengeEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `Enqueued ${ChallengeEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the challenge Indexer synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ChallengeEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the challenge Indexer synchronization interval.
     */
    @Interval(envConfig().services.synchronizer.indexer.challenge.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitiesSyncing,
            {
                dump: `${ChallengeEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
