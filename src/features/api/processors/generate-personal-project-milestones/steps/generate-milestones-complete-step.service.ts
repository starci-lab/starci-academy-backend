import type {
    GeneratePersonalProjectMilestonesPayload,
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
    MilestoneEntity,
    MilestoneTaskEntity,
    MilestoneTaskPassCriteriaEntity,
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
import type {
    GenerateMilestonesExecutionResult,
} from "./generate-milestones-step.service"
import {
    GenerateMilestonesStepService,
} from "./generate-milestones-step.service"

/**
 * Step 1: last pipeline step (persist execution slice + advance job).
 */
@Injectable()
export class GenerateMilestonesCompleteStepService extends AbstractStepService<
    GeneratePersonalProjectMilestonesPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly generateMilestonesStepService: GenerateMilestonesStepService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
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
     * Execute the step.
     * Read generated structure from job.executionResults, then persist DB rows.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
    ): Promise<GenerateMilestonesCompleteResult> {
        const generated = await this.jobActionService.loadExecutionResult<GenerateMilestonesExecutionResult>(
            {
                job: context.job,
                key: this.generateMilestonesStepService.stepName,
            },
        )

        if (!generated?.enrollmentId || !Array.isArray(generated.milestones)) {
            throw new Error("Missing generated milestones payload from previous step.")
        }

        const locale = context.payload.locale ?? Locale.En
        const milestoneCount = generated.milestones.length
        const taskCount = generated.milestones.reduce(
            (total, milestone) => total + milestone.tasks.length,
            0,
        )
        const criteriaCount = generated.milestones.reduce(
            (total, milestone) =>
                total + milestone.tasks.reduce(
                    (taskTotal, task) => taskTotal + task.passCriteria.length,
                    0,
                ),
            0,
        )
        await this.entityManager.transaction(
            async (entityManager) => {
                await entityManager
                    .createQueryBuilder()
                    .delete()
                    .from(MilestoneEntity)
                    .where(
                        "enrollment_id = :enrollmentId",
                        {
                            enrollmentId: generated.enrollmentId,
                        },
                    )
                    .execute()
                const milestonesToPersist = generated.milestones.map((milestone) => (
                    entityManager.create(
                        MilestoneEntity,
                        {
                            title: milestone.title,
                            week: milestone.week,
                            orderIndex: milestone.orderIndex,
                            defaultLocale: locale,
                            enrollment: {
                                id: generated.enrollmentId,
                            },
                            tasks: milestone.tasks.map((task) => (
                                entityManager.create(
                                    MilestoneTaskEntity,
                                    {
                                        title: task.title,
                                        description: task.description || null,
                                        orderIndex: task.orderIndex,
                                        defaultLocale: locale,
                                        passCriteria: task.passCriteria.map((criteria) => (
                                            entityManager.create(
                                                MilestoneTaskPassCriteriaEntity,
                                                {
                                                    text: criteria.text,
                                                    promptText: criteria.promptText,
                                                    orderIndex: criteria.orderIndex,
                                                    defaultLocale: locale,
                                                },
                                            )
                                        )),
                                    },
                                )
                            )),
                        },
                    )
                ))
                await entityManager.save(
                    MilestoneEntity,
                    milestonesToPersist,
                )
            })

        return {
            enrollmentId: generated.enrollmentId,
            milestoneCount,
            taskCount,
            criteriaCount,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: GenerateMilestonesCompleteResult,
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
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

interface GenerateMilestonesCompleteResult {
    enrollmentId: string
    milestoneCount: number
    taskCount: number
    criteriaCount: number
}
