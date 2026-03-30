import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS,
} from "@payos/node"
import {
    PayosWebhookRequest,
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

/**
 * Verifies payOS webhooks via {@link PayOS#webhooks#verify} (checksum/signature handled by the SDK).
 *
 * @see https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/ — SDK: `payOS.webhooks.verify(req.body)`
 */
@Injectable()
export class PayosWebhookService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {}

    /**
     * Entry: Verifies the webhook payload.
     * @param body - The webhook payload.
     */
    async execute(
        body: PayosWebhookRequest,
    ) {
        // verify the webhook payload
        await this.payos.webhooks.verify(body)
        // retrieve the user and course from transaction
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
            throw new TransactionNotFoundException(
                {
                    referenceId: body.data.orderCode.toString(),
                },
            )
        }
        // check if the transaction is still in time
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction?.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs < envConfig().services.api.transaction.timeSinceCreationMs) {
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
