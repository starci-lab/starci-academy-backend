import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./streak.module-definition"
import {
    BuyStreakFreezeSingleMutationModule,
} from "./buy-streak-freeze"

/**
 * Streak mutation group — buy a streak freeze with Coin.
 */
@Module({
    imports: [
        BuyStreakFreezeSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class StreakMutationsModule extends ConfigurableModuleClass {}
