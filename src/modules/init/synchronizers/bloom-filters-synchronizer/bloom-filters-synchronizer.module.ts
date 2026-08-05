import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./bloom-filters-synchronizer.module-definition"
import {
    BloomFilterSynchronizerService,
} from "./bloom-filter-synchronizer.service"

@Module({
    providers: [
        BloomFilterSynchronizerService,
    ],
    exports: [
        BloomFilterSynchronizerService,
    ],
})
/**
 * Wires {@link BloomFilterSynchronizerService} for boot-time email bloom rebuild.
 * Configurable so init can register it globally beside CDN/ES/indexer sinks.
 */
export class BloomFiltersSynchronizerModule extends ConfigurableModuleClass { }
