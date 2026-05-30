import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./credit.module-definition"
import {
    CreditUsageService,
} from "./credit-usage.service"

/**
 * Module for AI credit usage business logic.
 */
@Module({
    providers: [
        CreditUsageService,
    ],
    exports: [
        CreditUsageService,
    ],
})
export class CreditModule extends ConfigurableModuleClass {
}
