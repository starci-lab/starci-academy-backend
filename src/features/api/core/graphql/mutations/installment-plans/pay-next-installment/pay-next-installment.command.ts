import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PayNextInstallmentRequest,
} from "./graphql-types"

/**
 * CQRS command carrying the "pay next installment cycle" request + auth context.
 */
export class PayNextInstallmentCommand {
    constructor(
        readonly params: ExecuteParams<PayNextInstallmentRequest>,
    ) { }
}
