import {
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    nextPricingPhase,
    PricingPhase,
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
    EnrollPayload 
} from "@modules/bullmq"
import {
    AbstractStepService,
} from "../../abstracts"
import {
    WinstonLog,
    WinstonService 
} from "@modules/winston"
import {
    CourseNotFoundException 
} from "@modules/exceptions"
import {
    JobExtendedContext 
} from "../../types"
import {
    EnrollStepExecutionResult 
} from "../types"
/**
 * Step service: create enrollment relation between user and course.
 */
@Injectable()
export class EnrollStepService extends AbstractStepService<EnrollPayload, undefined> {
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
        context: JobExtendedContext<EnrollPayload, undefined>
    ): Promise<void> {
        // execute the step
        const executionResult = await this.execute(context)
        // finalize the step
        await this.finalize(
            executionResult,
            context
        )
    }

    /**
     * Execute the step.
     * @param context - The context of the job.
     * @returns A promise that resolves when the action is executed.
     */
    private async execute(
        {
            payload: {
                courseId,
                userId,
                transactionId,
            },
        }: JobExtendedContext<EnrollPayload, undefined>
    ): Promise<EnrollStepExecutionResult> {
        // process the transaction
        await this.entityManager.transaction(
            async (entityManager) => {
                // get the course
                const course = await entityManager.findOne(
                    CourseEntity,
                    {
                        where: {
                            id: courseId 
                        },
                        lock: {
                            mode: "pessimistic_write" 
                        },
                    }
                )
                // throw error if course not found
                if (!course) {
                    throw new CourseNotFoundException(
                        {
                            id: courseId,
                        },
                    )
                }
                // get the current pricing phase
                const currentPhase = course?.currentPhase ?? PricingPhase.Regular
                // create the enrollment
                const enrollment = entityManager.create(
                    EnrollmentEntity,
                    {
                        userId,
                        courseId,
                        pricingPhase: currentPhase,
                    }
                )
                await entityManager.save(
                    enrollment,
                )
                // check if the pricing phase is exceeded
                const phase = course?.pricingPhases.find(
                    (phase) => phase.phase === currentPhase,
                )
                // get the enrollment count
                const enrollmentCount = await entityManager.count(
                    EnrollmentEntity,
                    {
                        where: {
                            courseId,
                        },
                    },
                )
                if (!phase?.slotAvailable || enrollmentCount > phase.slotAvailable) {
                    // update the course
                    course.currentPhase = nextPricingPhase(currentPhase)
                    await entityManager.save(course)
                }
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
        return {
        }
    }
    /**
     * Finalize the step.
     * @param jobId - The ID of the job.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: EnrollStepExecutionResult,
        {
            payload,
            queueName,
            job,
        }: JobExtendedContext<EnrollPayload, undefined>
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
                        executionResult,
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
