import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
import {
    ICQRSHandler,
} from "@modules/cqrs"
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
    InjectSepay,
} from "@modules/sepay"
import {
    Sepay,
} from "@modules/sepay/sepay.client"
import {
    Injectable,
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
    constructor(
        @InjectSepay()
        private readonly sepay: Sepay,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
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
        const referenceId = body.code

        let transaction: TransactionEntity | null = null

        if (referenceId) {
            transaction = await this.entityManager.findOne(
                TransactionEntity,
                {
                    where: {
                        referenceId: referenceId.toString(),
                        status: TransactionStatus.Pending,
                    },
                },
            )
        }

        if (!transaction) {
            const pendingTransactions = await this.entityManager.find(
                TransactionEntity,
                {
                    where: {
                        status: TransactionStatus.Pending,
                    },
                },
            )
            transaction = pendingTransactions.find(
                (t) => body.content.includes(t.referenceId),
            ) || null
        }

        if (!transaction) {
            throw new TransactionNotFoundException({
                referenceId: referenceId || "unknown",
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
