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
/**
 * Registers cancelRedemption so an admin can void a pending redemption without
 * the rewards aggregator importing the resolver class.
 */
export class CancelRedemptionSingleMutationModule extends ConfigurableModuleClass {}
