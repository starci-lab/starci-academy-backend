import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cancel-redemption.module-definition"
import {
    CancelRedemptionResolver,
} from "./cancel-redemption.resolver"

@Module({
    providers: [
        CancelRedemptionResolver,
    ],
})
export class CancelRedemptionSingleMutationModule extends ConfigurableModuleClass {}
