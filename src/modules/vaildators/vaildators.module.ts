import {
    Module,
} from "@nestjs/common"
import {
    UrlValidatorService,
} from "./url.service"
import {
    ConfigurableModuleClass,
} from "./vaildators.module-definition"

/**
 * Module for URL validation helpers.
 */
@Module({
    providers: [
        UrlValidatorService,
    ],
    exports: [
        UrlValidatorService,
    ],
})
export class VaildatorsModule extends ConfigurableModuleClass {}