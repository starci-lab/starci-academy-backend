import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./buy-streak-freeze.module-definition"
import {
    BuyStreakFreezeResolver,
} from "./buy-streak-freeze.resolver"

@Module({
    providers: [
        BuyStreakFreezeResolver,
    ],
})
export class BuyStreakFreezeSingleMutationModule extends ConfigurableModuleClass {}
