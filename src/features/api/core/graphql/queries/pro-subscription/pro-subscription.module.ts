import {
    Module,
} from "@nestjs/common"
import {
    ProSubscriptionQueriesResolver,
} from "./pro-subscription.resolver"

@Module({
    providers: [
        ProSubscriptionQueriesResolver,
    ],
})
/** Registers public Pro catalog and authenticated entitlement reads. */
export class ProSubscriptionQueriesModule {}
