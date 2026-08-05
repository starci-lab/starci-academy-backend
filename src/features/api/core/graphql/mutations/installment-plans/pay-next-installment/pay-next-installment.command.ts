import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PayNextInstallmentRequest,
} from "./graphql-types/request"

/**
 * CQRS command carrying the "pay next installment cycle" request + auth context.
 */
export class PayNextInstallmentCommand {
    constructor(
        readonly params: ExecuteParams<PayNextInstallmentRequest>,
    ) { }
}
