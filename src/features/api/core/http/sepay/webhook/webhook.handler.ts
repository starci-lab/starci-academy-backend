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
import type {
    EntityManager,
} from "typeorm"
import {
    SepayWebhookCommand,
} from "./webhook.command"

@CommandHandler(SepayWebhookCommand)
@Injectable()
/** Turn an authenticated SePay IPN into a deduplicated immediate reconcile wake-up. */
export class SepayWebhookHandler
    extends ICQRSHandler<SepayWebhookCommand, void>
    implements ICommandHandler<SepayWebhookCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: SepayWebhookCommand,
    ): Promise<void> {
        const invoice = command.params.order?.order_invoice_number
            ?? command.params.order_invoice_number

        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "sepay.webhook.ipn-received",
                referenceId: invoice,
            },
        )
        if (!invoice) {
            return
        }

        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId: invoice,
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
                id: `sepay-webhook:${transaction.id}`,
                ttlMs: 30_000,
            },
        })
    }
}
