import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionGrantService,
} from "@modules/bussiness/transactions/atomic/transaction-grant.service"
import {
    getStripeWebhookSecret,
} from "@modules/filesystem/utils/mount-secrets"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    InjectStripe,
} from "@modules/integrations/stripe/stripe.providers"
import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    Stripe,
} from "stripe"
import {
    StripeWebhookCommand,
} from "./webhook.command"

@CommandHandler(StripeWebhookCommand)
@Injectable()
/**
 * Constructs the Stripe event with the webhook secret then settles only
 * `checkout.session.completed` -- other types must not enroll or refund here.
 */
export class StripeWebhookHandler
    extends ICQRSHandler<StripeWebhookCommand, void>
    implements ICommandHandler<StripeWebhookCommand, void> {
    constructor(
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly transactionGrantService: TransactionGrantService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: StripeWebhookCommand,
    ): Promise<void> {
        const transaction = await this.resolvePayableTransaction(command)
        if (!transaction) {
            // an ignorable event (unsupported type / unpaid session) -- already logged
            return
        }
        await this.transactionGrantService.grantForTransaction(transaction)
    }

    /**
     * Verify + parse the event, decide whether it is a completed & paid Checkout
     * Session worth granting (ignoring other event types and unpaid sessions), and
     * resolve it to the matching, unexpired, still-pending transaction.
     * @param command - The webhook command carrying the raw body and signature.
     * @returns The transaction to grant, or `null` when the event should be silently ignored.
     */
    private async resolvePayableTransaction(
        command: StripeWebhookCommand,
    ): Promise<TransactionEntity | null> {
        // pull the raw body + signature captured by the controller
        const {
            rawBody,
            signature,
        } = command.params
        // the signing secret used to verify the event came from Stripe;
        // read from the mounted secret file (never an env var)
        const webhookSecret = getStripeWebhookSecret().trim()

        // verify + parse the event; a bad signature throws and rejects the call
        const event = this.stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret,
        )

        // only a completed Checkout Session means the payment succeeded
        if (event.type !== "checkout.session.completed") {
            // ignore other event types (refunds, disputes, etc. handled elsewhere)
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "stripe.webhook.ignored",
                    meta: {
                        eventType: event.type,
                        reason: "unsupported event type",
                    },
                },
            )
            return null
        }

        // the guard above narrowed the event union to `checkout.session.completed`,
        // so `data.object` is already the Checkout Session -- no cast needed. the
        // session echoes our reference id back via client_reference_id
        const session = event.data.object

        // `checkout.session.completed` can fire for an async payment method whose
        // funds have NOT cleared yet -- only a `paid` session means money is in
        if (session.payment_status !== "paid") {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "stripe.webhook.ignored",
                    referenceId: session.id,
                    meta: {
                        paymentStatus: session.payment_status,
                        reason: "payment not paid",
                    },
                },
            )
            return null
        }

        const referenceId = session.client_reference_id
        if (!referenceId) {
            // without our reference id we cannot match a transaction -> reject
            throw new TransactionNotFoundException({
                referenceId: "missing client_reference_id",
            })
        }

        // resolve + expiry-check the pending transaction (shared across every
        // gateway webhook once its own event verification has resolved a referenceId)
        return this.transactionGrantService.resolvePendingTransaction(referenceId)
    }
}
