import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    SeedScopeService,
    SyncScopeService,
} from "./scope"
import {
    SeedersService,
} from "./seeders"
import {
    SynchronizersService,
} from "./synchronizers"

/**
 * Boot-time initialization orchestrator.
 *
 * Runs the two init phases sequentially during `onModuleInit` — before the app
 * starts listening — each gated by its master switch in `seed.yaml`:
 *
 *   1. seeders        (when `seeders.enabled`)       sources       -> PostgreSQL
 *   2. synchronizers  (when `synchronizers.enabled`) PostgreSQL    -> CDN + ES
 *
 * Order is load-bearing: seeders write the DB, synchronizers read it.
 */
@Injectable()
export class InitService implements OnModuleInit {

    constructor(
        private readonly seedScopeService: SeedScopeService,
        private readonly syncScopeService: SyncScopeService,
        private readonly seedersService: SeedersService,
        private readonly synchronizersService: SynchronizersService,
    ) { }

    /**
     * Runs the enabled init phases sequentially (seeders, then synchronizers).
     */
    async onModuleInit(): Promise<void> {
        if (this.seedScopeService.isSeedersEnabled()) {
            await this.seedersService.init()
        }
        if (this.syncScopeService.isSynchronizersEnabled()) {
            await this.synchronizersService.init()
        }
    }
}
