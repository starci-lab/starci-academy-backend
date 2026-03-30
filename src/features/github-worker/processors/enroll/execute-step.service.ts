import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionStatus,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    TransactionActionService,
} from "@modules/bussiness"

export interface EnrollCreateRelationStepParams {
    userId: string
    courseId: string
    transactionId: string
}

export type EnrollCreateRelationStepResult = EnrollmentEntity

/**
 * Step service: create enrollment relation between user and course.
 */
@Injectable()
export class EnrollCreateRelationStepService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly transactionActionService: TransactionActionService,
    ) {}
    async execute(
        {
            userId,
            courseId,
            transactionId,
        }: EnrollCreateRelationStepParams
    ): Promise<EnrollCreateRelationStepResult> {
        await this.entityManager.transaction(
            async (entityManager) => {
            // create the enrollment
                const enrollment = entityManager.create(
                    EnrollmentEntity,
                    {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    }
                )
                await entityManager.save(
                    enrollment,
                )
                // update the transaction status
                await this.transactionActionService.updateTransactionStatus(
                    {
                        id: transactionId,
                        status: TransactionStatus.Succeeded,
                        entityManager,
                    }
                )
            }
        )
    }
}
