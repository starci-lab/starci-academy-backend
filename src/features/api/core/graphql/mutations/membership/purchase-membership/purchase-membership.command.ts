import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PurchaseMembershipRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for membership checkout -- provider branching stays in the
 * handler so the resolver does not import PayOS/SePay/Stripe clients.
 */
export class PurchaseMembershipCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseMembershipRequest>,
    ) { }
}
