import {
    EnqueueEnrollJobService,
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/transactional-email"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    MembershipService,
} from "@modules/membership"
import {
    envConfig,
} from "@modules/env"
import {
    AiSubscriptionTierNotAvailableException,
    PaymentUnderpaidException,
    SepayOrderNotPaidException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
    UnsupportedTransactionActionException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    InjectSepay,
} from "@modules/sepay"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    SepayWebhookCommand,
} from "./webhook.command"

@CommandHandler(SepayWebhookCommand)
@Injectable()
export class SepayWebhookHandler
    extends ICQRSHandler<SepayWebhookCommand, void>
    implements ICommandHandler<SepayWebhookCommand, void> {
    private readonly logger = new Logger(SepayWebhookHandler.name)

    constructor(
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    protected override async process(
        command: SepayWebhookCommand,
    ): Promise<void> {
        const body = command.params

        // log the raw IPN so the exact field names can be finalised from a real
        // SePay PG notification (payload shape is not documented yet)
        this.logger.log(`SePay PG IPN received: ${JSON.stringify(body)}`)

        // the real SePay IPN nests the invoice under `order`; fall back to the
        // legacy top-level field for safety
        const invoice = body.order?.order_invoice_number ?? body.order_invoice_number
        if (!invoice) {
            throw new TransactionNotFoundException({
                referenceId: "missing order_invoice_number",
            })
        }

        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId: invoice,
                    status: TransactionStatus.Pending,
                },
            },
        )

        if (!transaction) {
            throw new TransactionNotFoundException({
                referenceId: invoice,
            })
        }

        // authoritative verification: query the order-detail API (Basic auth
        // merchant:secret). A non-2xx response throws → the IPN is rejected.
        // We trust this server-to-server call, not the inbound IPN body.
        const orderDetail = await this.sepay.order.retrieve(invoice)
        this.logger.log(
            `SePay PG order detail (${invoice}): ${JSON.stringify(orderDetail.data)}`,
        )

        // CRITICAL: the order merely EXISTING is not proof of payment — read the
        // authoritative paid flag/status from the order detail (same check the
        // reconcile poll uses). Without this, anyone who knows an orderCode could
        // POST the webhook for an unpaid order and get enrolled for free.
        // SePay's order.retrieve wraps the order under `data.data` (HTTP body is
        // `{ data: { ...order... } }`); unwrap twice, falling back to `data` when
        // the response is not double-nested
        const httpBody = ((orderDetail as { data?: unknown })?.data ?? {
        }) as Record<string, unknown>
        const detailData = (
            (httpBody.data as Record<string, unknown> | undefined) ?? httpBody
        )
        // SePay marks a paid order with order_status CAPTURED / transaction APPROVED;
        // accept those plus the generic paid synonyms (read both `status` + `order_status`)
        const detailStatus = String(
            detailData.status ?? detailData.order_status ?? "",
        ).toLowerCase()
        const isPaid = detailData.paid === true
            || ["paid",
                "success",
                "completed",
                "settled",
                "captured",
                "approved"].includes(detailStatus)
        if (!isPaid) {
            throw new SepayOrderNotPaidException({
                invoice,
                detailStatus: detailStatus || "unknown",
            })
        }
        // underpayment guard: the gateway-reported amount must cover what we expect
        const reportedAmount = Number(
            detailData.amount ?? detailData.order_amount ?? body.order?.order_amount,
        )
        if (
            Number.isFinite(reportedAmount)
            && reportedAmount > 0
            && reportedAmount < transaction.amount
        ) {
            throw new PaymentUnderpaidException({
                orderId: invoice,
                reportedAmountVnd: reportedAmount,
                expectedAmountVnd: transaction.amount,
                provider: "sepay",
            })
        }

        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction?.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredError({
                id: transaction.id,
            })
        }
        switch (transaction.actionType) {
        // AI subscription purchase: grant the tier directly (no worker needed)
        case ActionType.AiSubscriptionPurchase: {
            if (!transaction.aiSubTier) {
                throw new AiSubscriptionTierNotAvailableException({
                    tier: "unknown",
                })
            }
            const subscriptionGranted = await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            if (subscriptionGranted) {
                await enqueueSubscriptionActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    tier: transaction.aiSubTier,
                    webBaseUrl: envConfig().web.baseUrl,
                })
            }
            return
        }
        // community membership purchase: grant/extend membership directly (no worker)
        case ActionType.MembershipPurchase: {
            const membershipGranted = await this.membershipService.grantMembership({
                userId: transaction.userId,
                transactionId: transaction.id,
            })
            if (membershipGranted) {
                await enqueueMembershipActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    webBaseUrl: envConfig().web.baseUrl,
                })
            }
            return
        }
        // course enrollment: hand off to the enroll worker
        case ActionType.Enroll: {
            // fan the paid order out to one enroll job per course (single- or
            // multi-course). a malformed Enroll transaction (no items, no course)
            // is surfaced as course-not-found so the gateway re-delivers.
            const {
                enqueuedCount,
            } = await this.enqueueEnrollJobService.enqueueForTransaction({
                transaction,
            })
            if (enqueuedCount === 0) {
                throw new TransactionCourseNotFoundException({
                    id: transaction.id,
                })
            }
            return
        }
        default:
            throw new UnsupportedTransactionActionException({
                actionType: String(transaction.actionType),
            })
        }
    }
}
