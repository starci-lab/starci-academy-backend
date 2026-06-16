import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rewards.module-definition"
import {
    RedeemRewardSingleMutationModule,
} from "./redeem-reward"

/**
 * Rewards mutation group — redeem a reward from the điểm quà gifts store.
 */
@Module({
    imports: [
        RedeemRewardSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class RewardsMutationsModule extends ConfigurableModuleClass {}
