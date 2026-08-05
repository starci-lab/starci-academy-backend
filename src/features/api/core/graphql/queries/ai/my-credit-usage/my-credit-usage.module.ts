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
/** Feature-module boundary for the `myCreditUsage` query -- wires its resolver so the AI group can mount this read independently. */
export class MyCreditUsageSingleQueryModule extends ConfigurableModuleClass {}
