import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PurchaseAiSubscriptionRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for purchaseAiSubscription -- keeps PayOS/SePay/Stripe/PayPal
 * checkout off the resolver so a provider swap does not touch the GraphQL leaf.
 */
export class PurchaseAiSubscriptionCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseAiSubscriptionRequest>,
    ) { }
}
