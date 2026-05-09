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
    MilestoneTaskCriteriaResultEntity,
    MilestoneTaskResultEntity,
    PersonalProjectAttemptEntity,
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
    DayjsService,
} from "@modules/mixin"
import {
    ReviewPersonalProjectTaskGradeStepService,
} from "./review-personal-project-task-grade-step.service"
import type {
    ReviewPersonalProjectTaskGradeResult,
} from "./review-personal-project-task-grade-step.service"

/**
 * Step 1: last pipeline step (persist execution slice + advance job).
 */
@Injectable()
export class ReviewPersonalProjectTaskCompleteStepService extends AbstractStepService<
    ReviewPersonalProjectTaskPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        private readonly gradeStepService: ReviewPersonalProjectTaskGradeStepService,
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
    ): Promise<ReviewPersonalProjectTaskCompleteResult> {
        const grade = await this.jobActionService.loadExecutionResult<ReviewPersonalProjectTaskGradeResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        if (
            !grade
            || !grade.enrollmentId
            || !grade.milestoneTaskId
            || !Array.isArray(grade.criteriaResults)
        ) {
            throw new Error("Missing or invalid grade execution result for review-personal-project-task.")
        }

        const existingAttempts = await this.entityManager.count(
            PersonalProjectAttemptEntity,
            {
                where: {
                    enrollment: {
                        id: grade.enrollmentId,
                    },
                },
            },
        )

        await this.entityManager.transaction(async (entityManager) => {
            const attempt = await entityManager.save(
                PersonalProjectAttemptEntity,
                {
                    enrollment: {
                        id: grade.enrollmentId,
                    },
                    attemptNumber: existingAttempts + 1,
                    submissionUrl: grade.githubUrl,
                    processedAt: this.dayjsService.now().toDate(),
                },
            )

            const taskResult = await entityManager.save(
                MilestoneTaskResultEntity,
                {
                    attempt: {
                        id: attempt.id,
                    },
                    milestoneTask: {
                        id: grade.milestoneTaskId,
                    },
                    passed: grade.allPassed,
                } as Partial<MilestoneTaskResultEntity>,
            )

            if (grade.criteriaResults.length > 0) {
                const criteriaEntities = grade.criteriaResults.map(
                    (criteria) =>
                        entityManager.create(
                            MilestoneTaskCriteriaResultEntity,
                            {
                                taskResult: {
                                    id: taskResult.id,
                                },
                                passCriteria: {
                                    id: criteria.passCriteriaId,
                                },
                                passed: criteria.passed,
                                feedback: criteria.feedback,
                            },
                        ),
                )
                await entityManager.save(
                    MilestoneTaskCriteriaResultEntity,
                    criteriaEntities,
                )
            }
        })

        return {
            enrollmentId: grade.enrollmentId,
            milestoneTaskId: grade.milestoneTaskId,
            allPassed: grade.allPassed,
            criteriaCount: grade.criteriaResults.length,
        }
    }

    private async finalize(
        executionResult: ReviewPersonalProjectTaskCompleteResult,
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
    }
}

interface ReviewPersonalProjectTaskCompleteResult {
    enrollmentId: string
    milestoneTaskId: string
    allPassed: boolean
    criteriaCount: number
}
