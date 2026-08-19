import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
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
/** Verify a PayOS callback and turn it into a deduplicated reconcile wake-up. */
export class PayosWebhookHandler
    extends ICQRSHandler<PayosWebhookCommand, void>
    implements ICommandHandler<PayosWebhookCommand, void> {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: PayosWebhookCommand,
    ): Promise<void> {
        const body = command.params
        await this.payos.webhooks.verify(body as Webhook)

        if (body.code !== "00" || body.success === false) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookReceived,
                {
                    op: "payos.webhook.ignored",
                    referenceId: body.data?.orderCode != null
                        ? String(body.data.orderCode)
                        : undefined,
                },
            )
            return
        }

        const orderCode = body.data?.orderCode
        if (orderCode == null) {
            return
        }

        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId: String(orderCode),
                },
            },
        )
        if (transaction?.status !== TransactionStatus.Pending) {
            return
        }

        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
            attempt: 1,
            delayMs: 0,
            lane: "fast",
            deduplication: {
                id: `payos-webhook:${transaction.id}`,
                ttlMs: 30_000,
            },
        })
    }
}
