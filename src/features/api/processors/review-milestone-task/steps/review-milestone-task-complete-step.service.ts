import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    ReviewMilestoneTaskGradeStepService,
} from "./review-milestone-task-grade-step.service"
import type {
    ReviewMilestoneTaskGradeResult,
} from "./review-milestone-task-grade-step.service"
import {
    MissingOrInvalidGradeExecutionResultException 
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Step 1: finalize — load grade result summary, log completion.
 */
@Injectable()
export class ReviewMilestoneTaskCompleteStepService extends AbstractStepService<
    ReviewPersonalProjectTaskPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly gradeStepService: ReviewMilestoneTaskGradeStepService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the review milestone task complete step.
     * @param context - The job extended context.
     * @returns The void.
     */
    async process(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<void> {
        const executionResult = await this.execute(
            context,
        )
        await this.finalize(
            executionResult,
            context,
        )
    }

    /**
     * Execute the review milestone task complete step.
     * @param context - The job extended context.
     * @returns The review milestone task complete result.
     */
    private async execute(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        const grade = await this.jobActionService.loadExecutionResult<ReviewMilestoneTaskGradeResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        if (!grade) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        if (typeof grade.evaluation !== "object" || typeof grade.passed !== "boolean") {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        await this.entityManager.transaction(
            async (entityManager) => {
                /** Find or create the user milestone task */
                let userMilestoneTask = await entityManager.findOne(
                    UserMilestoneTaskEntity,
                    {
                        where: {
                            enrollment: {
                                id: payload.enrollmentId,
                            },
                            milestoneTask: {
                                id: payload.taskId,
                            },
                        },
                    },
                )
                if (!userMilestoneTask) {
                    /** No attempts at all */
                    userMilestoneTask = entityManager.create(
                        UserMilestoneTaskEntity,
                        {
                            enrollment: {
                                id: payload.enrollmentId,
                            },
                            milestoneTask: {
                                id: payload.taskId,
                            },
                        },
                    )
                    await entityManager.save(userMilestoneTask)
                }
                /** Fetch all attempts for this user milestone task */
                const numAttempts = await entityManager.count(
                    UserMilestoneTaskAttemptEntity,
                    {
                        where: {
                            userMilestoneTask: {
                                id: userMilestoneTask.id,
                            },
                        },
                    },
                )
                /** Map the grade evaluation details to feedbacks */
                const feedbackRaws = grade.evaluation.details.map(
                    (detail) => {
                        return detail.feedbacks.map((feedback) => {
                            return {
                                message: feedback.message,
                                severity: feedback.severity,
                                location: feedback.location,
                                suggestion: feedback.suggestion,
                            }
                        })
                    }).flat()
                /** Map the feedbacks to the user milestone task attempt */
                const feedbacks = feedbackRaws.map(
                    (feedback, index) => {
                        return {
                            ...feedback,
                            orderIndex: index,
                            defaultLocale: payload.locale ?? Locale.En,
                        }
                    }
                )
                /** Save the user milestone task attempt */
                await entityManager.save(
                    UserMilestoneTaskAttemptEntity,
                    {
                        userMilestoneTask: {
                            id: userMilestoneTask.id,
                        },
                        processedAt: this.dayjsService.now().toDate(),
                        score: grade.evaluation.score,
                        shortFeedback: grade.evaluation.shortFeedback,
                        passed: grade.passed,
                        attemptNumber: numAttempts + 1,
                        feedbacks,
                    }
                )
            }
        )
        return {
        }
    }

    /**
     * Finalize the review milestone task complete step.
     * @param executionResult - The review milestone task complete result.
     * @param context - The job extended context.
     * @returns The void.
     */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
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
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
        this.eventEmitterService.emit({
            event: EventName.MilestoneTaskProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })
    }
}
