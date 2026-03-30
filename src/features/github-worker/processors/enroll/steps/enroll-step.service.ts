import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionStatus,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    JobActionService,
    TransactionActionService,
} from "@modules/bussiness"
import type {
    JobContext 
} from "../../types"
import {
    EnrollPayload 
} from "@modules/bullmq"
import {
    AbstractStepService,
} from "../../abstracts"
import {
    WinstonLog,
    WinstonService 
} from "@modules/winston"
/**
 * Step service: create enrollment relation between user and course.
 */
@Injectable()
export class EnrollStepService extends AbstractStepService<EnrollPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly transactionActionService: TransactionActionService,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 0
    /**
     * The name of the step.
     */
    stepName = "enroll"

    /**
     * Execute the step.
     * @param payload - The payload of the job.
     * @returns A promise that resolves when the step is executed.
     */
    async process(
        context: JobContext<EnrollPayload>
    ): Promise<void> {
        // execute the step
        await this.execute(context)
        // finalize the step
        await this.finalize(context)
    }

    /**
     * Execute the step.
     * @param payload - The payload of the job.
     * @returns A promise that resolves when the action is executed.
     */
    private async execute(
        {
            payload: {
                courseId,
                userId,
                transactionId,
            },
        }: JobContext<EnrollPayload>
    ): Promise<void> {
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
    /**
     * Finalize the step.
     * @param jobId - The ID of the job.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        {
            payload,
            queueName,
            job,
        }: JobContext<EnrollPayload>
    ): Promise<void> {
        // update the job and store the result
        await this.entityManager.transaction(
            async (entityManager) => {
                // update the transaction status
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
                // store the job result
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult: {
                        },
                        entityManager,
                    }
                )
            }
        )
        // log the step executed
        this.winstonService.log(
            WinstonLog.EnrollStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}
