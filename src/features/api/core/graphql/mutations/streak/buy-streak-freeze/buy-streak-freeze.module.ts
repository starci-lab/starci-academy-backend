import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./buy-streak-freeze.module-definition"
import {
    BuyStreakFreezeResolver,
} from "./buy-streak-freeze.resolver"

@Module({
    providers: [
        BuyStreakFreezeResolver,
    ],
})
/**
 * Registers streak-freeze purchase so spending currency on a freeze stays
 * out of the profile claim-reward leaves.
 */
export class BuyStreakFreezeSingleMutationModule extends ConfigurableModuleClass {}
