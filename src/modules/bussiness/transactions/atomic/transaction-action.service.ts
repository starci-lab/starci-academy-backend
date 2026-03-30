import {
    TransactionEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    UpdateTransactionStatusParams,
} from "../types"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    TransactionNotFoundException 
} from "@modules/exceptions"

/**
 * Service for transaction lifecycle management:
 * create -> increase steps -> complete/fail.
 * Supports optional transactional entity manager.
 */
@Injectable()
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
}
