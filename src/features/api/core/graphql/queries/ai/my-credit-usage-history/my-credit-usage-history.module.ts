import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-credit-usage-history.module-definition"
import {
    MyCreditUsageHistoryResolver,
} from "./my-credit-usage-history.resolver"

@Module({
    providers: [
        MyCreditUsageHistoryResolver,
    ],
})
export class MyCreditUsageHistorySingleQueryModule extends ConfigurableModuleClass {}
