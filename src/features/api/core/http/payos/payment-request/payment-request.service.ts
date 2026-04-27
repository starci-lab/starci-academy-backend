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
