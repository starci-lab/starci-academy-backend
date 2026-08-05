import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/integrations/transactional-email/grant-emails"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AiSubscriptionTierNotAvailableException,
} from "@modules/platform/exceptions/errors/ai/ai-subscription-tier-not-available"
import {
    PaymentUnderpaidException,
} from "@modules/platform/exceptions/errors/payment/payment-underpaid"
import {
    SepayOrderNotPaidException,
} from "@modules/platform/exceptions/errors/payment/sepay-order-not-paid"
import {
    UnsupportedTransactionActionException,
} from "@modules/platform/exceptions/errors/payment/unsupported-transaction-action"
import {
    TransactionCourseNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-course-not-found"
import {
    TransactionExpiredError,
} from "@modules/platform/exceptions/errors/transaction/transaction-expired"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectSepay,
} from "@modules/integrations/sepay/sepay.providers"
import {
    SePayPgClient,
} from "sepay-pg-node"
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
    EntityManager,
} from "typeorm"
import {
    SepayWebhookCommand,
} from "./webhook.command"

@CommandHandler(SepayWebhookCommand)
@Injectable()
/**
 * Matches `order_invoice_number` (falling back to the legacy top-level invoice) then
 * settles -- a missing invoice must not silently drop the IPN.
 */
export class SepayWebhookHandler
    extends ICQRSHandler<SepayWebhookCommand, void>
    implements ICommandHandler<SepayWebhookCommand, void> {
    constructor(
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: SepayWebhookCommand,
    ): Promise<void> {
        const body = command.params

        // the real SePay IPN nests the invoice under `order`; fall back to the
        // legacy top-level field for safety
        const invoice = body.order?.order_invoice_number ?? body.order_invoice_number

        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "sepay.webhook.ipn-received",
                referenceId: invoice,
            },
        )

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
        // merchant:secret). A non-2xx response throws -> the IPN is rejected.
        // We trust this server-to-server call, not the inbound IPN body.
        const orderDetail = await this.sepay.order.retrieve(invoice)
        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "sepay.webhook.order-detail",
                referenceId: invoice,
                meta: {
                    orderDetail: orderDetail.data,
                },
            },
        )

        // CRITICAL: the order merely EXISTING is not proof of payment -- read the
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
                try {
                    await this.notificationService.createNotification({
                        userId: transaction.userId,
                        type: NotificationType.SubscriptionGranted,
                        title: {
                            key: "notification.subscriptionGranted.title",
                            params: {
                                tier: transaction.aiSubTier,
                            },
                        },
                    })
                } catch (error) {
                    // best-effort: a notification failure must never fail a webhook
                    // that already granted a paid tier
                    this.winstonService.log(
                        WinstonLog.NotificationCreateFailed,
                        {
                            jobId: transaction.id,
                            step: "notification.create",
                            error: error instanceof Error ? error.message : String(error),
                        },
                    )
                }
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
