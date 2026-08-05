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
/** Feature-module boundary for the `myCreditUsageHistory` query -- wires its resolver so the AI group can mount this read independently. */
export class MyCreditUsageHistorySingleQueryModule extends ConfigurableModuleClass {}
