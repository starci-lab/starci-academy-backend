import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PurchaseMembershipRequest,
} from "./graphql-types"

/**
 * CQRS envelope for membership checkout — provider branching stays in the
 * handler so the resolver does not import PayOS/SePay/Stripe clients.
 */
export class PurchaseMembershipCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseMembershipRequest>,
    ) { }
}
