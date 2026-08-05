import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PurchaseAiSubscriptionRequest,
} from "./graphql-types"

/**
 * CQRS envelope for purchaseAiSubscription -- keeps PayOS/SePay/Stripe/PayPal
 * checkout off the resolver so a provider swap does not touch the GraphQL leaf.
 */
export class PurchaseAiSubscriptionCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseAiSubscriptionRequest>,
    ) { }
}
