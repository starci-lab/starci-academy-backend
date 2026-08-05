import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./redeem-reward.module-definition"
import {
    RedeemRewardResolver,
} from "./redeem-reward.resolver"

@Module({
    providers: [
        RedeemRewardResolver,
    ],
})
/**
 * Registers redeemReward so spending points for a catalogue item stays a
 * single Nest unit under the rewards aggregator.
 */
export class RedeemRewardSingleMutationModule extends ConfigurableModuleClass {}
