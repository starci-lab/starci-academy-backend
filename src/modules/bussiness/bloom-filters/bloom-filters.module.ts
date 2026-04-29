import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./bloom-filters.module-definition"
import {
    EmailBloomFilterService,
} from "./email.service"

/**
 * The module for the bussiness logics.
 */
@Module({
    providers: [
        EmailBloomFilterService,
    ],
    exports: [
        EmailBloomFilterService,
    ],
})
export class BloomFiltersModule extends ConfigurableModuleClass {
}