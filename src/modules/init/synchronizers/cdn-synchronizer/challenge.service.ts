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
    ChallengeEntity,
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
export class ChallengeCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) { }

    /**
     * Process the challenge CDN synchronization.
     */
    private async process() {
        const syncAt = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `Enqueue ${ChallengeEntity.name} sync at ${syncAt.toISOString()}`,
            }
        )
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: ChallengeEntity.name,
                syncAt,
            }
        )
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `Enqueued ${ChallengeEntity.name} sync`,
            }
        )
    }

    /**
     * On application bootstrap process the challenge CDN synchronization.
     */
    async onApplicationBootstrap() {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `${ChallengeEntity.name} sync bootstrap trigger`,
            }
        )
        await this.process()
    }

    /**
     * Handle the challenge CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.challenge.interval)
    async handleInterval() {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCoursesSyncing,
            {
                dump: `${ChallengeEntity.name} sync interval trigger`,
            }
        )
        await this.process()
    }
}
