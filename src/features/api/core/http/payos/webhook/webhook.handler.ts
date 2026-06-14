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
    MembershipService,
} from "@modules/membership"
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
    InjectPayOS,
} from "@modules/payos"
import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    PayOS,
} from "@payos/node"
import type {
    EntityManager,
} from "typeorm"
import {
    PayosWebhookCommand,
} from "./webhook.command"

@CommandHandler(PayosWebhookCommand)
@Injectable()
export class PayosWebhookHandler
    extends ICQRSHandler<PayosWebhookCommand, void>
    implements ICommandHandler<PayosWebhookCommand, void> {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    protected override async process(
        command: PayosWebhookCommand,
    ): Promise<void> {
        const body = command.params
        await this.payos.webhooks.verify(body)
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId: body.data.orderCode.toString(),
                    status: TransactionStatus.Pending,
                },
            },
        )
        if (!transaction) {
            throw new TransactionNotFoundException({
                referenceId: body.data.orderCode.toString(),
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
            await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            return
        }
        // community membership purchase: grant/extend membership directly (no worker)
        case ActionType.MembershipPurchase: {
            await this.membershipService.grantMembership({
                userId: transaction.userId,
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
