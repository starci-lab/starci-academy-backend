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
        private readonly elasticsearchIndexResetService: ElasticsearchIndexResetService,
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
        // drop + re-create ES indices first when reindex is requested, so the
        // sync below repopulates a clean, correctly-mapped set of indices
        if (this.syncScopeService.isReIndexEnabled()) {
            await this.elasticsearchIndexResetService.resetAllIndices()
        }
        await this.elasticsearchSynchronizerService.sync(elasticsearchScope)
        await this.indexerSynchronizerService.sync(cdnScope)
        await this.bloomFilterSynchronizerService.sync()
        const repoScope = this.syncScopeService.buildRepoScope()
        await this.repoSynchronizerService.sync(repoScope)
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
