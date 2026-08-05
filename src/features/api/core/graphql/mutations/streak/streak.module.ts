import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./streak.module-definition"
import {
    BuyStreakFreezeSingleMutationModule,
} from "./buy-streak-freeze"

@Module({
    imports: [
        BuyStreakFreezeSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Streak mutation group — buy a streak freeze with Coin.
 */
export class StreakMutationsModule extends ConfigurableModuleClass {}
