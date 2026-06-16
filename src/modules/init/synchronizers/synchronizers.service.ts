import {
    Injectable,
} from "@nestjs/common"
import {
    CdnSynchronizerService,
} from "./cdn-synchronizer"
import {
    ElasticsearchSynchronizerService,
} from "./elasticsearch-synchronizer"
import {
    IndexerSynchronizerService,
} from "./indexer-synchronizer"
import {
    BloomFilterSynchronizerService,
} from "./bloom-filters-synchronizer"
import {
    RepoSynchronizerService,
} from "./repo-synchronizer"
import {
    ReconcileSynchronizerService,
} from "./reconcile-synchronizer"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    ElasticsearchIndexResetService,
} from "@modules/elasticsearch"
import {
    EsSyncUserService,
} from "@modules/bussiness"
import {
    SyncScopeService,
} from "../scope"

/**
 * Sequential sync orchestrator.
 *
 * Runs all sync tasks (CDN, Elasticsearch, Indexer, Email Bloom Filter)
 * sequentially — one domain completes before the next starts.
 * Called by InitService as a plugin.
 */
@Injectable()
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
     * Initialize — runs all sync tasks sequentially.
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
        await this.esSyncUserService.reindexAll()
        await this.indexerSynchronizerService.sync(cdnScope)
        await this.bloomFilterSynchronizerService.sync()
        const repoScope = this.syncScopeService.buildRepoScope()
        await this.repoSynchronizerService.sync(repoScope)
        // ES + CDN now reflect the freshly-seeded DB → delete any leftover ghost
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
