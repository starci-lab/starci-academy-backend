import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    SeedScopeService,
    SyncScopeService,
    SeedersService,
    SynchronizersService,
} from "@modules/init"

/**
 * Parked local-file initialization orchestrator (legacy v1).
 *
 * Runs the two init phases sequentially during `onModuleInit` — before the app
 * starts listening — each gated by its master switch in `_seed.yaml`:
 *
 *   1. seeders        (when `seeders.enabled`)       sources       -> PostgreSQL
 *   2. synchronizers  (when `synchronizers.enabled`) PostgreSQL    -> CDN + ES
 *
 * Order is load-bearing: seeders write the DB, synchronizers read it. The
 * canonical git-sourced orchestrator now lives in `@modules/init`; this module
 * is kept (un-registered by default) for local-file dev use.
 */
@Injectable()
export class LegacyInitService implements OnModuleInit {

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
