import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../types/execute"
import {
    PaymentRequestResponseData,
} from "./dtos/response"
import {
    PaymentRequestQuery,
} from "./payment-request.query"
import type {
    PaymentRequestRequest,
} from "./dtos/request"

@Injectable()
/**
 * Dispatches payment-status through the query bus so the controller does not import PayOS.
 */
export class PaymentRequestService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatches the payment-status query.
     *
     * @param params - Request context carrying the PayOS payment id.
     * @returns The payment as PayOS currently reports it.
     */
    async execute(
        params: ExecuteParams<PaymentRequestRequest>,
    ): Promise<PaymentRequestResponseData> {
        return this.queryBus.execute(
            new PaymentRequestQuery(params),
        )
    }
}
