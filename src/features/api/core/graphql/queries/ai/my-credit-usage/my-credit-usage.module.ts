import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-credit-usage.module-definition"
import {
    MyCreditUsageResolver,
} from "./my-credit-usage.resolver"

@Module({
    providers: [
        MyCreditUsageResolver,
    ],
})
export class MyCreditUsageSingleQueryModule extends ConfigurableModuleClass {}
