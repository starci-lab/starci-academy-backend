import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    PaymentRequestResponseData,
} from "./dtos"
import {
    PaymentRequestQuery,
} from "./payment-request.query"

@Injectable()
/**
 * Dispatches payment-status through the query bus so the controller does not import PayOS.
 */
export class PaymentRequestService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        id: string,
    ): Promise<PaymentRequestResponseData> {
        return this.queryBus.execute(
            new PaymentRequestQuery(id),
        )
    }
}
