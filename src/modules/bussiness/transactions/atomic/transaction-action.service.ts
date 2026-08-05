import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    Injectable,
} from "@nestjs/common"
import type {
    UpdateTransactionStatusIfExpectedParams,
    UpdateTransactionStatusParams,
} from "../types/transaction"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"

@Injectable()
/**
 * Service for transaction lifecycle management:
 * create -> increase steps -> complete/fail.
 * Supports optional transactional entity manager.
 */
export class TransactionActionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly primaryEntityManager: EntityManager,
    ) {}

    /**
     * Update the status of a transaction.
     * @param id - The ID of the transaction.
     * @param status - The status to update to.
     * @param entityManager - The entity manager.
     * @returns The transaction.
     */
    async updateTransactionStatus({
        id,
        status,
        entityManager,
    }: UpdateTransactionStatusParams): Promise<void> {
        // get the manager
        const manager = entityManager ?? this.primaryEntityManager
        // get the transaction
        const transaction = await manager.findOne(
            TransactionEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!transaction) {
            throw new TransactionNotFoundException(
                {
                    id,
                },
            )
        }
        // update the transaction status
        transaction.status = status
        await manager.save(transaction)
    }

    /**
     * Conditionally move a transaction to `status` ONLY while it is still in
     * `expectedStatus`, via a single guarded `UPDATE ... WHERE status=expected`.
     * Prevents a late race (e.g. a reconcile poll marking `unpaid`) from
     * clobbering a status a concurrent webhook already advanced (e.g. `succeeded`).
     *
     * @param params - id, the target `status`, the required `expectedStatus`, optional manager.
     * @returns true when the row was updated; false when the guard did not match.
     */
    async updateTransactionStatusIfExpected({
        id,
        status,
        expectedStatus,
        entityManager,
    }: UpdateTransactionStatusIfExpectedParams): Promise<boolean> {
        const manager = entityManager ?? this.primaryEntityManager
        const result = await manager.update(
            TransactionEntity,
            {
                id,
                status: expectedStatus,
            },
            {
                status,
            },
        )
        return Boolean(result.affected)
    }
}
