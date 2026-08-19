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
    InvalidNowpaymentsWebhookSignatureException,
} from "@modules/platform/exceptions/errors/payment/invalid-nowpayments-webhook-signature"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    toUnknownRecord,
} from "@modules/lib/common/utils/unknown-record"
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
import {
    NowPaymentsWebhookCommand,
} from "./webhook.command"

@CommandHandler(NowPaymentsWebhookCommand)
@Injectable()
/**
 * Verifies HMAC over the raw body then settles the transaction -- a mismatched signature
 * means the payload is untrusted and must be rejected.
 */
export class NowPaymentsWebhookHandler
    extends ICQRSHandler<NowPaymentsWebhookCommand, void>
    implements ICommandHandler<NowPaymentsWebhookCommand, void> {
    constructor(
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly transactionGrantService: TransactionGrantService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: NowPaymentsWebhookCommand,
    ): Promise<void> {
        const transaction = await this.resolvePayableTransaction(command)
        if (!transaction) {
            // an ignorable event (intermediate status / underpaid order) -- already logged
            return
        }
        await this.transactionGrantService.grantForTransaction(transaction)
    }

    /**
     * Verify the IPN signature, decide whether the event is a payable event worth
     * granting (ignoring intermediate statuses and underpaid orders), and resolve
     * it to the matching, unexpired, still-pending transaction.
     * @param command - The webhook command carrying the raw body and signature header.
     * @returns The transaction to grant, or `null` when the event should be silently ignored.
     */
    private async resolvePayableTransaction(
        command: NowPaymentsWebhookCommand,
    ): Promise<TransactionEntity | null> {
        // destructure the IPN body + signature header
        const {
            body,
            signature,
        } = command.params

        // verify the IPN: recompute HMAC-SHA512 of the sorted body vs the header
        const verified = this.nowPaymentsClient.verifySignature({
            body: toUnknownRecord(body),
            signature,
        })
        if (!verified) {
            // mismatched signature means the payload is untrusted -> reject
            throw new InvalidNowpaymentsWebhookSignatureException({
                paymentId: body.payment_id != null ? String(body.payment_id) : undefined,
            })
        }

        if (this.isIntermediatePaymentStatus(body.payment_status)) {
            // ignore intermediate statuses (waiting / confirming / partially_paid)
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "nowpayments.webhook.ignored",
                    referenceId: body.order_id,
                    meta: {
                        paymentStatus: body.payment_status,
                        reason: "intermediate payment status",
                    },
                },
            )
            return null
        }

        // underpayment guard: crypto can settle "finished" while the buyer sent
        // less than quoted -- require the received amount to cover the expected one
        const payAmount = Number(body.pay_amount)
        const actuallyPaid = Number(body.actually_paid)
        if (this.isUnderpaidOrder(payAmount,
            actuallyPaid)) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "nowpayments.webhook.ignored",
                    referenceId: body.order_id,
                    meta: {
                        actuallyPaid,
                        payAmount,
                        reason: "underpaid order",
                    },
                },
            )
            return null
        }

        // order_id carries our transaction reference id
        const referenceId = body.order_id
        if (!referenceId) {
            // without our reference id we cannot match a transaction -> reject
            throw new TransactionNotFoundException({
                referenceId: "missing order_id",
            })
        }

        // resolve + expiry-check the pending transaction (shared across every
        // gateway webhook once its own event verification has resolved a referenceId)
        return this.transactionGrantService.resolvePendingTransaction(referenceId)
    }

    /** Whether a NOWPayments status is a non-terminal in-flight state, not yet "paid". */
    private isIntermediatePaymentStatus(paymentStatus: unknown): boolean {
        return paymentStatus !== "finished" && paymentStatus !== "confirmed"
    }

    /**
     * Whether the buyer sent less than the quoted crypto amount -- NOWPayments can
     * still settle the payment as "finished"/"confirmed" while underpaid.
     */
    private isUnderpaidOrder(payAmount: number, actuallyPaid: number): boolean {
        return Number.isFinite(payAmount)
            && payAmount > 0
            && Number.isFinite(actuallyPaid)
            && actuallyPaid < payAmount
    }
}
