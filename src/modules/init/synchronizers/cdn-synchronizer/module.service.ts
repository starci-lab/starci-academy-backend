import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EnqueueSyncCdnJobService,
} from "@modules/bussiness/jobs/enqueue/sync-cdn.service"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
/**
 * @deprecated Replaced by {@link CdnSynchronizerService}. Per-module interval
 * enqueue kept for reference; not registered on {@link CdnSynchronizerModule}.
 */
export class ModuleCdnSynchronizerService implements OnApplicationBootstrap {
    constructor(
        private readonly dayjsService: DayjsService,
        private readonly enqueueSyncCdnJobService: EnqueueSyncCdnJobService,
    ) {}

    /**
     * Process the module CDN synchronization.
     */
    private async process() {
        await this.enqueueSyncCdnJobService.enqueue(
            {
                entityKind: ModuleEntity.name,
                syncAt: this.dayjsService.now(),
            }
        )
    }

    /**
     * On application bootstrap process the module CDN synchronization.
     */
    async onApplicationBootstrap() {
        await this.process()
    }

    /**
     * Handle the module CDN synchronization interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.module.interval)
    async handleInterval() {
        await this.process()
    }
}
