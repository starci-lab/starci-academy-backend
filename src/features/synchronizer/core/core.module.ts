import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./core.module-definition"
import {
    SyncOrchestratorService,
} from "./sync-orchestrator.service"
import {
    CdnSynchronizerModule
} from "./cdn-synchronizer"
import {
    ElasticsearchSynchronizerModule
} from "./elasticsearch-synchronizer"
import {
    IndexerSynchronizerModule
} from "./indexer-synchronizer"
import {
    BloomFiltersSynchronizerModule
} from "./bloom-filters-synchronizer"

/**
 * Core synchronizer module.
 *
 * Registers the {@link SyncOrchestratorService} which runs all sync tasks
 * sequentially in `onModuleInit` before the app starts listening.
 */
@Module({
    imports: [
        CdnSynchronizerModule.register({
            isGlobal: true,
        }),
        ElasticsearchSynchronizerModule.register({
            isGlobal: true,
        }),
        IndexerSynchronizerModule.register({
            isGlobal: true,
        }),
        BloomFiltersSynchronizerModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SyncOrchestratorService,
    ],
    exports: [
        SyncOrchestratorService,
    ],
})
export class CoreModule extends ConfigurableModuleClass {
}
