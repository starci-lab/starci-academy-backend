import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./fulfill-redemption.module-definition"
import {
    FulfillRedemptionResolver,
} from "./fulfill-redemption.resolver"

@Module({
    providers: [
        FulfillRedemptionResolver,
    ],
})
export class FulfillRedemptionSingleMutationModule extends ConfigurableModuleClass {}
