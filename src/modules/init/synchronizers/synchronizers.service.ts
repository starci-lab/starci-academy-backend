import {
    Injectable,
} from "@nestjs/common"
import {
    CdnSynchronizerService,
} from "./cdn-synchronizer/cdn-synchronizer.service"
import {
    ElasticsearchSynchronizerService,
} from "./elasticsearch-synchronizer/elasticsearch-synchronizer.service"
import {
    IndexerSynchronizerService,
} from "./indexer-synchronizer/indexer-synchronizer.service"
import {
    BloomFilterSynchronizerService,
} from "./bloom-filters-synchronizer/bloom-filter-synchronizer.service"
import {
    RepoSynchronizerService,
} from "./repo-synchronizer/repo-synchronizer.service"
import {
    ReconcileSynchronizerService,
} from "./reconcile-synchronizer/reconcile-synchronizer.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    ElasticsearchIndexResetService,
} from "@modules/integrations/elasticsearch/elasticsearch-index-reset.service"
import {
    EsSyncUserService,
} from "@modules/bussiness/es-sync/es-sync-user.service"
import {
    SyncScopeService,
} from "../scope/sync-scope.service"

@Injectable()
/**
 * Sequential sync orchestrator.
 *
 * Runs all sync tasks (CDN, Elasticsearch, Indexer, Email Bloom Filter)
 * sequentially -- one domain completes before the next starts.
 * Called by InitService as a plugin.
 */
export class SynchronizersService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        private readonly cdnSynchronizerService: CdnSynchronizerService,
        private readonly elasticsearchSynchronizerService: ElasticsearchSynchronizerService,
        private readonly indexerSynchronizerService: IndexerSynchronizerService,
        private readonly bloomFilterSynchronizerService: BloomFilterSynchronizerService,
        private readonly repoSynchronizerService: RepoSynchronizerService,
        private readonly reconcileSynchronizerService: ReconcileSynchronizerService,
        private readonly elasticsearchIndexResetService: ElasticsearchIndexResetService,
        private readonly esSyncUserService: EsSyncUserService,
        private readonly syncScopeService: SyncScopeService,
    ) { }

    /**
     * Initialize -- runs all sync tasks sequentially.
     */
    async init(): Promise<void> {
        const cdnScope = this.syncScopeService.buildCdnScope()
        const elasticsearchScope = this.syncScopeService.buildElasticsearchScope()
        /**
         * Start the sync orchestrator.
         */
        const start = this.dayjsService.now()
        await this.cdnSynchronizerService.sync(cdnScope)
        // drop + re-create the requested ES indices first, so the sync below
        // repopulates a clean, correctly-mapped set (the parser forces these
        // indices' ES sync to full, so a dropped index is never left empty)
        const reindexEntities = this.syncScopeService.reindexEntities()
        if (reindexEntities.length > 0) {
            await this.elasticsearchIndexResetService.resetIndices(reindexEntities)
        }
        await this.elasticsearchSynchronizerService.sync(elasticsearchScope)
        // backfill the non-localized `users` index from the existing user base
        // (one-shot bulk index + orphan prune); the CDC listener keeps it fresh
        // afterwards. Users live outside the per-locale content scope above.
        // Non-fatal: an ES bulk timeout here must not abort the remaining sync
        // steps (indexer / bloom / repo / reconcile) -- the CDC listener backfills
        // the users index on the next user change regardless.
        try {
            await this.esSyncUserService.reindexAll()
        } catch (error) {
            this.winstonService.log(WinstonLog.RequestHandlingFailed,
                {
                    op: "init.synchronizers.user-es-reindex-failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
        await this.indexerSynchronizerService.sync(cdnScope)
        await this.bloomFilterSynchronizerService.sync()
        const repoScope = this.syncScopeService.buildRepoScope()
        await this.repoSynchronizerService.sync(repoScope)
        // ES + CDN now reflect the freshly-seeded DB -> delete any leftover ghost
        // docs/objects for entities removed/renumbered out of the source
        await this.reconcileSynchronizerService.reconcile()
        /**
         * End the sync orchestrator.
         */
        this.winstonService.log(
            WinstonLog.SyncOrchestratorDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
