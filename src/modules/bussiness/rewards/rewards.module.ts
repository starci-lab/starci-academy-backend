import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rewards.module-definition"
import {
    RewardsService,
} from "./rewards.service"
import {
    VoucherService,
} from "./voucher.service"

@Module({
    providers: [
        RewardsService,
        VoucherService,
    ],
    exports: [
        RewardsService,
        VoucherService,
    ],
})
/**
 * Reward-store ("Coin shop") business module. Exports {@link RewardsService} so the
 * GraphQL `rewards` / `myRewardWallet` / `redeemReward` resolvers can read the
 * catalog + wallet and redeem rewards, and {@link VoucherService} so checkout
 * (course pricing / enroll) can preview + apply + settle a minted voucher. The
 * user/redemption/voucher tables they read are provided by the
 * globally-registered databases module.
 */
export class RewardsModule extends ConfigurableModuleClass {}
