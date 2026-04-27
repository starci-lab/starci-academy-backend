import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    SyncEmailBloomFilterModule,
} from "./sync-email-bloom-filter"
import {
    SyncCdnModule,
} from "./sync-cdn"
import {
    SyncElasticsearchModule,
} from "./sync-elasticsearch"
import {
    SyncIndexerModule,
} from "./sync-indexer"

/**
 * Module for the processors.
 */
@Module({
    imports: [
        SyncCdnModule.register(
            {
                isGlobal: true,
            }
        ),
        SyncElasticsearchModule.register(
            {
                isGlobal: true,
            }
        ),
        SyncEmailBloomFilterModule.register(
            {
                isGlobal: true,
            }
        ),
        SyncIndexerModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
