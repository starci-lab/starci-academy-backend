import {
    Module,
} from "@nestjs/common"
import {
    CdnSynchronizerModule,
} from "./cdn-synchronizer"
import {
    ElasticsearchSynchronizerModule,
} from "./elasticsearch-synchronizer"
import {
    IndexerSynchronizerModule,
} from "./indexer-synchronizer"
import {
    ConfigurableModuleClass,
} from "./core.module-definition"
import {
    BloomFiltersSynchronizerModule 
} from "./bloom-filters-synchronizer"

@Module({
    imports: [
        BloomFiltersSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        CdnSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        ElasticsearchSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        IndexerSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class CoreModule extends ConfigurableModuleClass {
}
