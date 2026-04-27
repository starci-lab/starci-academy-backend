import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    PayOS,
} from "@payos/node"
import {
    PaymentRequestResponseData,
} from "./dtos"
import {
    PaymentRequestQuery,
} from "./payment-request.query"

@QueryHandler(PaymentRequestQuery)
@Injectable()
export class PaymentRequestHandler
    extends ICQRSHandler<PaymentRequestQuery, PaymentRequestResponseData>
    implements IQueryHandler<PaymentRequestQuery, PaymentRequestResponseData> {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
    ) {
        super()
    }

    protected override async process(
        query: PaymentRequestQuery,
    ): Promise<PaymentRequestResponseData> {
        return await this.payos.paymentRequests.get(query.id)
    }
}
