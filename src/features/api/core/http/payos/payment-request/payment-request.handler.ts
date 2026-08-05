import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
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
} from "./dtos/response"
import {
    PaymentRequestQuery,
} from "./payment-request.query"

@QueryHandler(PaymentRequestQuery)
@Injectable()
/**
 * Fetches an existing PayOS payment by id so the SPA can poll status without holding PayOS
 * credentials.
 */
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
