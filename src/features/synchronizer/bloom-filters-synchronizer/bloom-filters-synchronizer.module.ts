import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./bloom-filters-synchronizer.module-definition"
import {
    EmailBloomFiltersSynchronizerService,
} from "./email.service"

@Module({
    providers: [
        EmailBloomFiltersSynchronizerService,
    ],
})
export class BloomFiltersSynchronizerModule extends ConfigurableModuleClass {}
