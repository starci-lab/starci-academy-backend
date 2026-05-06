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
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"

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
        private readonly retryService: RetryService,
        private readonly cdnSynchronizerService: CdnSynchronizerService,
        private readonly elasticsearchSynchronizerService: ElasticsearchSynchronizerService,
        private readonly indexerSynchronizerService: IndexerSynchronizerService,
        private readonly bloomFilterSynchronizerService: BloomFilterSynchronizerService,
    ) { }

    /**
     * Initialize — runs all sync tasks sequentially.
     */
    async init(): Promise<void> {
        /**
         * Start the sync orchestrator.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.SyncOrchestratorStarted,
            {
                startedAt: start,
            }
        )
        await this.retryService.retry({
            action: () => this.cdnSynchronizerService.sync(),
        })
        await this.retryService.retry({
            action: () => this.elasticsearchSynchronizerService.sync(),
        })
        await this.retryService.retry({
            action: () => this.indexerSynchronizerService.sync(),
        })
        await this.retryService.retry({
            action: () => this.bloomFilterSynchronizerService.sync(),
        })
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
