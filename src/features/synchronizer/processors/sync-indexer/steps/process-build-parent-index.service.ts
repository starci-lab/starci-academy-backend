import type {
    SyncIndexerPayload,
} from "@modules/bullmq"
import {
    AbstractStepService,
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,    ModuleEntity,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import {
    LessThanOrEqual,
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    IndexerChallengeBuildService,
    IndexerContentBuildService,
    IndexerModuleBuildService,
    IndexerCourseBuildService,
} from "../build"
import {
    SyncIndexerStepContextExecuteResult 
} from "../types"

/**
 * Step 1: Scan entities and cache parent index in Redis cache.
 *
 * Cache keys:
 * - parent.index:challenge:{id}
 * - parent.index:content:{id}
 */
@Injectable()
export class ProcessSyncIndexerBuildParentIndexStep extends AbstractStepService<
    SyncIndexerPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly indexerChallengeBuildService: IndexerChallengeBuildService,
        private readonly indexerContentBuildService: IndexerContentBuildService,
        private readonly indexerModuleBuildService: IndexerModuleBuildService,
        private readonly indexerCourseBuildService: IndexerCourseBuildService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "build-parent-index"
    stepContextKey = "build-parent-index-step-context"

    async process(
        context: JobExtendedContext<
            SyncIndexerPayload,
            EmptyObject
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: (error as Error).message,
                    emitChangeEvent: false,
                },
            )
            throw error
        }
    }

    private async execute(
        context: JobExtendedContext<
            SyncIndexerPayload,
            EmptyObject
        >,
    ): Promise<EmptyObject> {
        let done = false
        let resumeAfterId: string | null = null
        while (!done) {
            const { payload } = context
            const executionResult = await this.jobActionService.loadExecutionResult<
        SyncIndexerStepContextExecuteResult
        >(
            {
                job: context.job,
                key: this.stepContextKey,
            }
        )
            switch (payload.entityKind) {
            case CourseEntity.name: {
                const course = await this.entityManager.findOne(
                    CourseEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterId ? {
                                id: MoreThan(executionResult.resumeAfterId) 
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!course) {
                    done = true
                    break
                }

                await this.indexerCourseBuildService.buildIndexerById(
                    course.id,
                )
                resumeAfterId = course.id   
                break
            }
            case ChallengeEntity.name: {
                const challenge = await this.entityManager.findOne(
                    ChallengeEntity,
                    {
                        where: {
                            ...(
                                executionResult?.resumeAfterId ? {
                                    id: MoreThan(executionResult.resumeAfterId) 
                                } : {
                                }
                            ),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!challenge) {
                    done = true
                    break
                }
                await this.indexerChallengeBuildService.buildIndexerById(
                    challenge.id,
                )
                resumeAfterId = challenge.id
                break
            }
            case ContentEntity.name: {
                const content = await this.entityManager.findOne(
                    ContentEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterId ? {
                                id: MoreThan(executionResult.resumeAfterId) 
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!content) {
                    done = true
                    break
                }
                await this.indexerContentBuildService.buildIndexerById(
                    content.id,
                )
                resumeAfterId = content.id
                break
            }
            
            case ModuleEntity.name: {
                const module = await this.entityManager.findOne(
                    ModuleEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterId ? {
                                id: MoreThan(executionResult.resumeAfterId) 
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!module) {
                    done = true
                    break
                }
                await this.indexerModuleBuildService.buildIndexerById(
                    module.id,
                )
                resumeAfterId = module.id
                break
            }
            }
            await this.jobActionService.saveExecutionResult(
                {
                    job: context.job,
                    key: this.stepContextKey,
                    executionResult: {
                        resumeAfterId,
                    },
                }
            )
        }
        return {
        }
    }

    private async finalize(
        executionResult: SyncIndexerStepContextExecuteResult,
        context: JobExtendedContext<
            SyncIndexerPayload,
            EmptyObject
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob({
                    job,
                    entityManager,
                })
                await this.jobActionService.saveExecutionResult({
                    job,
                    key: this.stepName,
                    executionResult,
                    entityManager,
                })
            },
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

