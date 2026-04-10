import {
    Injectable,
} from "@nestjs/common"
import {
    InjectSepay,
} from "@modules/sepay"
import {
    Sepay,
} from "@modules/sepay/sepay.client"
import {
    SepayWebhookRequest,
} from "./dtos"
import {
    EnqueueEnrollJobService 
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager, 
    TransactionEntity,
    TransactionStatus
} from "@modules/databases"
import type {
    EntityManager 
} from "typeorm"
import {
    DayjsService 
} from "@modules/mixin"
import {
    envConfig 
} from "@modules/env"
import {
    TransactionNotFoundException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
} from "@modules/exceptions"

@Injectable()
export class SepayWebhookService {
    constructor(
        @InjectSepay()
        private readonly sepay: Sepay,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {}

    /**
     * Entry: Verifies the webhook payload and enqueues the enrollment job.
     */
    async execute(
        body: SepayWebhookRequest,
    ) {
        // SePay identifies the order either via `code`, or embedded in `transaction_content`
        let referenceId = body.code
        
        // Find transaction
        let transaction: TransactionEntity | null = null;
        
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
        
        // Fallback: search by partial match on transaction_content if not found
        if (!transaction) {
             const pendingTransactions = await this.entityManager.find(
                TransactionEntity,
                {
                    where: {
                        status: TransactionStatus.Pending,
                    }
                }
            )
            transaction = pendingTransactions.find(t => body.content.includes(t.referenceId)) || null;
        }

        if (!transaction) {
            throw new TransactionNotFoundException(
                {
                    referenceId: referenceId || "unknown",
                },
            )
        }
        
        // check if the transaction is still in time
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction?.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredError(
                {
                    id: transaction.id,
                },
            )
        }
        if (!transaction.courseId) {
            throw new TransactionCourseNotFoundException(
                {
                    id: transaction.id,
                },
            )
        }
        // enqueue the enroll job
        await this.enqueueEnrollJobService.enqueue(
            {
                userId: transaction.userId,
                courseId: transaction.courseId,
                transactionId: transaction.id,
            }
        ) 
    }
}
