import {
    ActivityType,
    CourseEntity,
    CourseMetadataEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    nextPricingPhase,
    PricingPhase,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    CourseStatsProjectionService,
    EnqueueResolveGithubJobService,
    JobActionService,
    TransactionActionService,
    UserService,
    writeActivity,
} from "@modules/bussiness"
import type {
    EnrollPayload
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService
} from "@modules/winston"
import {
    CourseNotFoundException
} from "@modules/exceptions"
import {
    AbstractStepService,
    JobExtendedContext
} from "@modules/bussiness"
import type {
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
        private readonly enqueueResolveGithubJobService: EnqueueResolveGithubJobService,
        private readonly winstonService: WinstonService,
        private readonly courseStatsProjectionService: CourseStatsProjectionService,
        private readonly userService: UserService,
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
        // whether the enrollment already existed (duplicate enroll job) → skip post-steps
        let alreadyEnrolled = false
        // process the transaction
        await this.entityManager.transaction(
            async (entityManager) => {
                // SERIALIZE concurrent enrollments for this course (pessimistic row lock on the
                // bare `courses` row — no relations, so FOR UPDATE is not applied to a nullable
                // outer join). Every enroll path must take this lock BEFORE counting seats /
                // advancing the pricing phase, so two users checking out at the same time can
                // never both slip into the same phase past its slot limit.
                await entityManager.findOne(
                    CourseEntity,
                    {
                        where: {
                            id: courseId,
                        },
                        lock: {
                            mode: "pessimistic_write",
                        },
                    },
                )
                // get the course
                const course = await entityManager.findOne(
                    CourseEntity,
                    {
                        where: {
                            id: courseId
                        },
                        relations: {
                            metadata: true,
                            pricingPhases: true,
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
                // idempotency (find-or-create, like the other processor steps): a duplicate
                // enroll job (multiple reconcile polls, or webhook + reconcile) must NOT
                // re-insert the enrollment — it would violate UQ_enrollments_user_course.
                // If already enrolled, just finalize the transaction and stop.
                const existingEnrollment = await entityManager.findOne(
                    EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: userId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    },
                )
                if (existingEnrollment) {
                    alreadyEnrolled = true
                    await this.transactionActionService.updateTransactionStatus(
                        {
                            id: transactionId,
                            status: TransactionStatus.Succeeded,
                            entityManager,
                        },
                    )
                    return
                }
                // get the current pricing phase
                // default to EarlyBird (Pioneer is internal/sold) — NOT Regular — when metadata
                // is absent, so a first enrollment does not wrongly jump the course to Regular.
                const currentPhase = course?.metadata?.currentPhase ?? PricingPhase.EarlyBird
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
                        pricingPhase: currentPhase,
                    }
                )
                await entityManager.save(
                    enrollment,
                )
                // refresh the course's enrollment-count projection in the same tx
                // (replaces the old Redis cache; CDC also covers it asynchronously)
                await this.courseStatsProjectionService.recompute({
                    courseId,
                    entityManager,
                })
                // home-feed activity for the enrollment (idempotent per enrollment row)
                await writeActivity({
                    entityManager,
                    userId,
                    type: ActivityType.CourseEnrolled,
                    idempotencyKey: enrollment.id,
                    metadata: {
                        target: {
                            entityName: CourseEntity.name,
                            id: courseId,
                            label: course?.title ?? "",
                        },
                    },
                })
                // check if the pricing phase is exceeded
                const phase = course?.pricingPhases.find(
                    (phase) => phase.phase === currentPhase,
                )
                // get the enrollment count
                const enrollmentCount = await entityManager.count(
                    EnrollmentEntity,
                    {
                        where: {
                            course: {
                                id: courseId,
                            },
                        },
                    },
                )
                if (!phase?.slotAvailable || enrollmentCount > phase.slotAvailable) {
                    const nextPhase = nextPricingPhase(currentPhase)
                    if (!course.metadata) {
                        course.metadata = entityManager.create(
                            CourseMetadataEntity,
                            {
                                currentPhase: nextPhase,
                                course,
                            },
                        )
                    } else {
                        course.metadata.currentPhase = nextPhase
                    }
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

        // a new enrollment changes this user's membership → drop the cached
        // enrolled-courses set so the next authorization check rebuilds it and
        // the just-bought course is immediately accessible (no stale `false`)
        if (!alreadyEnrolled) {
            await this.userService.invalidateEnrolledCourses(userId)
        }

        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: userId,
                },
            },
        )
        if (!alreadyEnrolled && user?.githubUsername) {
            await this.enqueueResolveGithubJobService.enqueue({
                userId,
                courseId,
                githubUsername: user.githubUsername,
            })
        }
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
