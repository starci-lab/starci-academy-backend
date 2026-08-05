import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./bloom-filters.module-definition"
import {
    EmailBloomFilterService,
} from "./email.service"

@Module({
    providers: [
        EmailBloomFilterService,
    ],
    exports: [
        EmailBloomFilterService,
    ],
})
/**
 * The module for the bussiness logics.
 */
export class BloomFiltersModule extends ConfigurableModuleClass {
}