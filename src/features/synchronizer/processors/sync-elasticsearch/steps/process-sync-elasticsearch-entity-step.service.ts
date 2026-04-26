import type {
    SyncElasticsearchPayload,
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
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
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
    ElasticsearchChallengesBuildService,
    ElasticsearchContentsBuildService,
    ElasticsearchCoursesBuildService,
    ElasticsearchLessonVideosBuildService,
} from "../build"

/**
 * Step 0: index the target entity into Elasticsearch using the same build-inject pattern as sync-cdn.
 */
@Injectable()
export class ProcessSyncElasticsearchEntityStepService extends AbstractStepService<
    SyncElasticsearchPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly elasticsearchCoursesBuildService: ElasticsearchCoursesBuildService,
        private readonly elasticsearchChallengesBuildService: ElasticsearchChallengesBuildService,
        private readonly elasticsearchContentsBuildService: ElasticsearchContentsBuildService,
        private readonly elasticsearchLessonVideosBuildService: ElasticsearchLessonVideosBuildService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "sync-elasticsearch-entity"
    stepContextKey = "sync-elasticsearch-entity-step-context"

    /** Process the step. */
    async process(
        context: JobExtendedContext<SyncElasticsearchPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(
                context,
            )
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
            )
            throw error
        }
    }

    /**
     * Execute the step.
     * @param context - The context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<SyncElasticsearchPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        switch (payload.entityKind) {
        case CourseEntity.name: {
            await this.elasticsearchCoursesBuildService.buildIndexById(
                payload.id,
            )
            break
        }
        case ChallengeEntity.name: {
            await this.elasticsearchChallengesBuildService.buildIndexById(
                payload.id,
            )
            break
        }
        case ContentEntity.name: {
            await this.elasticsearchContentsBuildService.buildIndexById(
                payload.id,
            )
            break
        }
        case LessonVideoEntity.name: {
            await this.elasticsearchLessonVideosBuildService.buildIndexById(
                payload.id,
            )
            break
        }
        }
        return {
        }
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<SyncElasticsearchPayload, EmptyObject>,
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
