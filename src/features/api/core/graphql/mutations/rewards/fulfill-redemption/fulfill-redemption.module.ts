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
/**
 * Registers fulfillRedemption — the admin mark-as-shipped write — as its own
 * Nest unit so fulfilment cannot be wired without its resolver.
 */
export class FulfillRedemptionSingleMutationModule extends ConfigurableModuleClass {}
