import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./synchronizers.module-definition"
import {
    SynchronizersService,
} from "./synchronizers.service"
import {
    CdnSynchronizerModule,
} from "./cdn-synchronizer/cdn-synchronizer.module"
import {
    ElasticsearchSynchronizerModule,
} from "./elasticsearch-synchronizer/elasticsearch-synchronizer.module"
import {
    IndexerSynchronizerModule,
} from "./indexer-synchronizer/indexer-synchronizer.module"
import {
    BloomFiltersSynchronizerModule,
} from "./bloom-filters-synchronizer/bloom-filters-synchronizer.module"
import {
    RepoSynchronizerModule,
} from "./repo-synchronizer/repo-synchronizer.module"
import {
    ReconcileSynchronizerService,
} from "./reconcile-synchronizer/reconcile-synchronizer.service"

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
        RepoSynchronizerModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SynchronizersService,
        ReconcileSynchronizerService,
    ],
    exports: [
        SynchronizersService,
    ],
})
/**
 * Core synchronizer module.
 *
 * Registers the {@link SynchronizersService} which runs all sync tasks
 * sequentially in `onModuleInit` before the app starts listening.
 */
export class SynchronizersModule extends ConfigurableModuleClass {
}
