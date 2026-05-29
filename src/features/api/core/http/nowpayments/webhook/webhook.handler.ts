import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
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
    envConfig,
} from "@modules/env"
import {
    AiSubscriptionTierNotAvailableException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    NowPaymentsWebhookCommand,
} from "./webhook.command"

@CommandHandler(NowPaymentsWebhookCommand)
@Injectable()
export class NowPaymentsWebhookHandler
    extends ICQRSHandler<NowPaymentsWebhookCommand, void>
    implements ICommandHandler<NowPaymentsWebhookCommand, void> {
    private readonly logger = new Logger(NowPaymentsWebhookHandler.name)

    constructor(
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    protected override async process(
        command: NowPaymentsWebhookCommand,
    ): Promise<void> {
        // destructure the IPN body + signature header
        const {
            body,
            signature,
        } = command.params

        // verify the IPN: recompute HMAC-SHA512 of the sorted body vs the header
        const verified = this.nowPaymentsClient.verifySignature({
            body: body as unknown as Record<string, unknown>,
            signature,
        })
        if (!verified) {
            // mismatched signature means the payload is untrusted → reject
            throw new UnauthorizedException("Invalid NOWPayments IPN signature")
        }

        // only a finished/confirmed payment counts as paid
        if (
            body.payment_status !== "finished"
            && body.payment_status !== "confirmed"
        ) {
            // ignore intermediate statuses (waiting / confirming / partially_paid)
            this.logger.log(`Ignoring NOWPayments status: ${String(body.payment_status)}`)
            return
        }

        // order_id carries our transaction reference id
        const referenceId = body.order_id
        if (!referenceId) {
            // without our reference id we cannot match a transaction → reject
            throw new TransactionNotFoundException({
                referenceId: "missing order_id",
            })
        }

        // locate the matching pending transaction
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId,
                    status: TransactionStatus.Pending,
                },
            },
        )
        if (!transaction) {
            throw new TransactionNotFoundException({
                referenceId,
            })
        }

        // reject stale callbacks that arrive after the reuse/expiry window
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredError({
                id: transaction.id,
            })
        }

        // grant by action type (mirrors the PayOS/Sepay webhook grant logic)
        switch (transaction.actionType) {
        // AI subscription purchase: grant the tier directly (no worker needed)
        case ActionType.AiSubscriptionPurchase: {
            if (!transaction.aiSubTier) {
                throw new AiSubscriptionTierNotAvailableException({
                    tier: "unknown",
                })
            }
            await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            return
        }
        // course enrollment: hand off to the enroll worker
        case ActionType.Enroll: {
            if (!transaction.courseId) {
                throw new TransactionCourseNotFoundException({
                    id: transaction.id,
                })
            }
            await this.enqueueEnrollJobService.enqueue({
                userId: transaction.userId,
                courseId: transaction.courseId,
                transactionId: transaction.id,
            })
            return
        }
        default:
            throw new BadRequestException(
                `Unsupported transaction action type: ${String(transaction.actionType)}`,
            )
        }
    }
}
