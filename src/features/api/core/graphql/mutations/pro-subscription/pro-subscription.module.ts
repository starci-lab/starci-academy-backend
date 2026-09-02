import {
    Module,
} from "@nestjs/common"
import {
    ProSubscriptionMutationsResolver,
} from "./pro-subscription.resolver"

@Module({
    providers: [
        ProSubscriptionMutationsResolver,
    ],
})
/** Registers the unified Pro write surface. */
export class ProSubscriptionMutationsModule {}
