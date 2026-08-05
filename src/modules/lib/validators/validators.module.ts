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
/**
 * Module for URL validation helpers.
 */
export class ValidatorsModule extends ConfigurableModuleClass {}