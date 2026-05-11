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
    EnrollmentEntity,
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
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

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

    private async execute(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<ReviewMilestoneTaskCompleteResult> {
        const grade = await this.jobActionService.loadExecutionResult<ReviewMilestoneTaskGradeResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        if (
            !grade
            || !grade.enrollmentId
            || !grade.milestoneTaskId
            || !grade.userMilestoneTaskId
        ) {
            throw new Error("Missing or invalid grade execution result for review-milestone-task.")
        }

        return {
            enrollmentId: grade.enrollmentId,
            milestoneTaskId: grade.milestoneTaskId,
            userMilestoneTaskId: grade.userMilestoneTaskId,
            passed: grade.passed,
            totalScore: grade.totalScore,
            maxScore: grade.maxScore,
            criteriaCount: grade.criteriaCount,
            failedCriteriaCount: grade.failedCriteriaCount,
        }
    }

    private async finalize(
        executionResult: ReviewMilestoneTaskCompleteResult,
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

        /** Emit event to update milestone task progress cache via NATS */
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: { id: executionResult.enrollmentId },
                select: { id: true, courseId: true },
            },
        )
        if (enrollment) {
            await this.eventEmitterService.emit({
                event: EventName.MilestoneTaskProgressUpdated,
                payload: {
                    enrollmentId: enrollment.id,
                    courseId: enrollment.courseId,
                },
            })
        }
    }
}

interface ReviewMilestoneTaskCompleteResult {
    enrollmentId: string
    milestoneTaskId: string
    userMilestoneTaskId: string
    passed: boolean
    totalScore: number
    maxScore: number
    criteriaCount: number
    failedCriteriaCount: number
}
