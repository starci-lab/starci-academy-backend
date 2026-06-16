import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rewards.module-definition"
import {
    RewardsService,
} from "./rewards.service"

/**
 * Reward-store ("điểm quà") business module. Exports {@link RewardsService} so the
 * GraphQL `rewards` / `myRewardWallet` / `redeemReward` resolvers can read the
 * catalog + wallet and redeem rewards. The user/redemption tables it reads are
 * provided by the globally-registered databases module.
 */
@Module({
    providers: [
        RewardsService,
    ],
    exports: [
        RewardsService,
    ],
})
export class RewardsModule extends ConfigurableModuleClass {}
