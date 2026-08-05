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
/** Feature-module boundary for the `myRewardWallet` query -- wires its resolver so the dashboard group can mount this widget independently. */
export class MyRewardWalletSingleQueryModule extends ConfigurableModuleClass {}
