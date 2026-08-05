import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"

@Injectable()
/**
 * Startup catch-up for transaction reconciliation.
 *
 * BullMQ delayed jobs live only in Redis, so a transaction can be left `pending`
 * forever if the backend was down when its poll was due, if Redis lost the job,
 * or if it predates this feature. On app boot this sweep re-enqueues an immediate
 * poll for every overdue pending transaction, with the `attempt` derived from how
 * long it has already been pending ("from last time") so an old transaction
 * resumes near the end of its budget instead of restarting the full poll loop.
 */
export class ReconcileTransactionBootSweepService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * On boot, re-enqueue an immediate reconcile poll for every overdue pending transaction.
     */
    async onApplicationBootstrap(): Promise<void> {
        const {
            delayMs,
            maxAttempts,
        } = envConfig().services.api.transaction.reconcile
        const now = this.dayjsService.now()
        // page through pending transactions (id + createdAt only) so RAM stays flat
        // even with a large backlog of abandoned checkouts.
        const pageSize = 200
        let skip = 0
        let count = 0
        for (;;) {
            const page = await this.entityManager.find(
                TransactionEntity,
                {
                    where: {
                        status: TransactionStatus.Pending,
                    },
                    select: {
                        id: true,
                        createdAt: true,
                    },
                    order: {
                        createdAt: "ASC",
                    },
                    take: pageSize,
                    skip,
                },
            )
            if (page.length === 0) {
                break
            }
            for (const transaction of page) {
                // how long this transaction has already been pending
                const elapsedMs = now.diff(
                    this.dayjsService.from(transaction.createdAt),
                    "milliseconds",
                )
                // fresh transactions still have their originally-scheduled delayed job → skip
                if (elapsedMs < delayMs) {
                    continue
                }
                // resume at the attempt the elapsed time maps to (clamped to the budget)
                const attempt = Math.min(
                    maxAttempts,
                    Math.max(1,
                        Math.floor(elapsedMs / delayMs)),
                )
                // poll immediately (delayMs: 0) rather than waiting another full interval
                await this.enqueueReconcileTransactionJobService.enqueue({
                    transactionId: transaction.id,
                    attempt,
                    delayMs: 0,
                })
                count += 1
            }
            if (page.length < pageSize) {
                break
            }
            skip += pageSize
        }
        // one summary line so the boot catch-up is observable
        this.winstonService.log(
            WinstonLog.TransactionReconcileBootSweep,
            {
                transactionId: "*",
                attempt: 0,
                count,
            },
        )
    }
}
