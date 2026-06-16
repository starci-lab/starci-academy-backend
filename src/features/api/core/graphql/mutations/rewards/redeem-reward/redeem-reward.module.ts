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
export class RedeemRewardSingleMutationModule extends ConfigurableModuleClass {}
