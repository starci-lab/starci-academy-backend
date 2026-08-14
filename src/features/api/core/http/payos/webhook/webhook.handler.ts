import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/integrations/transactional-email/grant-emails"
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
    UnsupportedTransactionActionException,
} from "@modules/platform/exceptions/errors/payment/unsupported-transaction-action"
import {
    TransactionCourseNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-course-not-found"
import {
    TransactionExpiredException,
} from "@modules/platform/exceptions/errors/transaction/transaction-expired"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
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
    PayOS,
} from "@payos/node"
import type {
    Webhook,
} from "@payos/node"
import type {
    EntityManager,
} from "typeorm"
import {
    PayosWebhookCommand,
} from "./webhook.command"

@CommandHandler(PayosWebhookCommand)
@Injectable()
/**
 * Verifies the PayOS signature then settles -- unsigned or failed probes are ignored so a
 * cancelled checkout cannot enroll.
 */
export class PayosWebhookHandler
    extends ICQRSHandler<PayosWebhookCommand, void>
    implements ICommandHandler<PayosWebhookCommand, void> {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly installmentPlanService: InstallmentPlanService,
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
        command: PayosWebhookCommand,
    ): Promise<void> {
        const body = command.params
        // verifies the signature (throws on tamper) and returns the signed data
        await this.payos.webhooks.verify(body as Webhook)

        // signature-valid != paid: PayOS also signs failure/cancel callbacks. The
        // authoritative success signal is `code === "00"` (the top-level `success`
        // boolean is not always present in the raw payload -- e.g. the URL probe).
        if (body.code !== "00" || body.success === false) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "payos.webhook.ignored",
                    referenceId: body.data?.orderCode != null
                        ? String(body.data.orderCode)
                        : undefined,
                    meta: {
                        code: body.code,
                        success: body.success,
                        reason: "code not success",
                    },
                },
            )
            return
        }

        // PayOS validates the webhook URL by POSTing a probe with a sample orderCode.
        // Ack (200) anything we can't match to a pending transaction -- a probe or a
        // stray callback is not an error; throwing would make PayOS mark the URL
        // "inactive" and make real callbacks retry. Grant only on a real match.
        const orderCode = body.data?.orderCode
        if (orderCode == null) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "payos.webhook.ignored",
                    meta: {
                        reason: "missing orderCode (URL probe?)",
                    },
                },
            )
            return
        }
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId: orderCode.toString(),
                    status: TransactionStatus.Pending,
                },
            },
        )
        if (!transaction) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "payos.webhook.ignored",
                    referenceId: orderCode.toString(),
                    meta: {
                        reason: "no matching pending transaction (probe/stray)",
                    },
                },
            )
            return
        }
        // underpayment guard: the signed amount must cover what we expect (VND)
        const paidAmount = Number(body.data?.amount)
        if (
            Number.isFinite(paidAmount)
            && paidAmount > 0
            && paidAmount < transaction.amount
        ) {
            throw new PaymentUnderpaidException({
                orderId: orderCode.toString(),
                reportedAmountVnd: paidAmount,
                expectedAmountVnd: transaction.amount,
                provider: "payos",
            })
        }
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction?.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredException({
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
        // a later installment cycle is already attached to its plan; applying
        // the signed payment atomically claims Pending -> Succeeded and advances
        // that plan exactly once, including webhook/reconcile races.
        case ActionType.InstallmentPayment: {
            if (!transaction.installmentPlanId) {
                throw new UnsupportedTransactionActionException({
                    actionType: `${transaction.actionType}:missing-plan`,
                })
            }
            await this.installmentPlanService.applyPaymentForTransaction({
                transactionId: transaction.id,
                planId: transaction.installmentPlanId,
                paidAmountVnd: transaction.amount,
            })
            return
        }
        default:
            throw new UnsupportedTransactionActionException({
                actionType: String(transaction.actionType),
            })
        }
    }
}
