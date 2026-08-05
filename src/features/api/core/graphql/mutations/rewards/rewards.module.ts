import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rewards.module-definition"
import {
    RedeemRewardSingleMutationModule,
} from "./redeem-reward/redeem-reward.module"
import {
    FulfillRedemptionSingleMutationModule,
} from "./fulfill-redemption/fulfill-redemption.module"
import {
    CancelRedemptionSingleMutationModule,
} from "./cancel-redemption/cancel-redemption.module"

@Module({
    imports: [
        RedeemRewardSingleMutationModule.register({
            isGlobal: true,
        }),
        FulfillRedemptionSingleMutationModule.register({
            isGlobal: true,
        }),
        CancelRedemptionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Rewards mutation group -- redeem a reward from the Coin shop, plus the
 * ops-only terminal-state transitions (fulfil a shipped physical redemption,
 * cancel/refund a redemption).
 */
export class RewardsMutationsModule extends ConfigurableModuleClass {}
