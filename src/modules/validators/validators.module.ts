import {
    Module,
} from "@nestjs/common"
import {
    UrlValidatorService,
} from "./url.service"
import {
    BloomFilterService,
} from "./bloom-filter.service"
import {
    ConfigurableModuleClass,
} from "./validators.module-definition"

/**
 * Module for URL validation helpers.
 */
@Module({
    providers: [
        UrlValidatorService,
        BloomFilterService,
    ],
    exports: [
        UrlValidatorService,
        BloomFilterService,
    ],
})
export class ValidatorsModule extends ConfigurableModuleClass {}