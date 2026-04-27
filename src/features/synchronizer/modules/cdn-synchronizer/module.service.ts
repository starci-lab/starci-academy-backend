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
    ModuleEntity,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    Interval 
} from "@nestjs/schedule"

@Injectable()
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
