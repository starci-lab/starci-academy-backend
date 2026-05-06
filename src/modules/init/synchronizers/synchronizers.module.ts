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
 * Registers the {@link SynchronizersService} which runs all sync tasks
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
        SynchronizersService,
    ],
    exports: [
        SynchronizersService,
    ],
})
export class SynchronizersModule extends ConfigurableModuleClass {
}
