import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
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
    }
}
