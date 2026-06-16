import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-reward-wallet.module-definition"
import {
    MyRewardWalletResolver,
} from "./my-reward-wallet.resolver"

@Module({
    providers: [
        MyRewardWalletResolver,
    ],
})
export class MyRewardWalletSingleQueryModule extends ConfigurableModuleClass {}
