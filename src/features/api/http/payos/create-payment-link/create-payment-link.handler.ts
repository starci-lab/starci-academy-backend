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
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    PayOS,
} from "@payos/node"
import {
    CreatePaymentLinkCommand,
} from "./create-payment-link.command"
import {
    CreatePaymentLinkResponseData,
} from "./dtos/response"

@CommandHandler(CreatePaymentLinkCommand)
@Injectable()
export class CreatePaymentLinkHandler
    extends ICQRSHandler<CreatePaymentLinkCommand, CreatePaymentLinkResponseData>
    implements ICommandHandler<CreatePaymentLinkCommand, CreatePaymentLinkResponseData> {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
    ) {
        super()
    }

    protected override async process(
        command: CreatePaymentLinkCommand,
    ): Promise<CreatePaymentLinkResponseData> {
        const {
            amount,
            cancelUrl,
            description,
            orderCode,
            returnUrl,
        } = command.params
        return await this.payos.paymentRequests.create({
            amount,
            cancelUrl,
            description,
            orderCode,
            returnUrl,
        })
    }
}
