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
export class BloomFiltersSynchronizerModule extends ConfigurableModuleClass { }
