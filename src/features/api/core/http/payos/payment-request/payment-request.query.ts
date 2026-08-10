import {
    ExecuteParams,
} from "../../../types/execute"
import type {
    PaymentRequestRequest,
} from "./dtos/request"

/**
 * CQRS query carrying the request context for the payment-status read -- a query rather than a
 * command because polling must be side-effect free.
 */
export class PaymentRequestQuery {
    constructor(
        readonly params: ExecuteParams<PaymentRequestRequest>,
    ) {}
}
