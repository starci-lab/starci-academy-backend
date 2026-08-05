/**
 * CQRS query keyed by PayOS payment id -- a query (not command) because polling must be
 * side-effect free.
 */
export class PaymentRequestQuery {
    constructor(
        readonly id: string,
    ) {}
}
