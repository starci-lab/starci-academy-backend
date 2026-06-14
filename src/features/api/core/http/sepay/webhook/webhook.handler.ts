import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
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
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
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
    BadRequestException,
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

        const invoice = body.order_invoice_number
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
