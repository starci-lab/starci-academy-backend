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
    InjectPrimaryPostgreSQLEntityManager,    ModuleEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    ConsultantEntity,
    HeadhuntingCompanyEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    LessThanOrEqual,
    MoreThan,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ElasticsearchChallengeBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchCourseBuildService,
    ElasticsearchModuleBuildService,
    ElasticsearchFoundationBuildService,
    ElasticsearchFoundationCategoryBuildService,
    ElasticsearchHeadhunterCompanyBuildService,
    ElasticsearchConsultantBuildService,
} from "../builder"
import {
    SyncElasticsearchEntityStepContextExecutionResult
} from "../types"

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
        private readonly elasticsearchCourseBuildService: ElasticsearchCourseBuildService,
        private readonly elasticsearchChallengeBuildService: ElasticsearchChallengeBuildService,
        private readonly elasticsearchContentBuildService: ElasticsearchContentBuildService,
        private readonly elasticsearchModuleBuildService: ElasticsearchModuleBuildService,
        private readonly elasticsearchFoundationBuildService: ElasticsearchFoundationBuildService,
        private readonly elasticsearchFoundationCategoryBuildService: ElasticsearchFoundationCategoryBuildService,
        private readonly elasticsearchHeadhunterCompanyBuildService: ElasticsearchHeadhunterCompanyBuildService,
        private readonly elasticsearchHeadhunterBuildService: ElasticsearchConsultantBuildService,
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
                    error: error.message,
                    emitChangeEvent: false,
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
        let done = false
        let resumeAfterEntityId: string | null = null
        while (!done) {
            const { payload } = context
            const executionResult = await this.jobActionService.loadExecutionResult<
                SyncElasticsearchEntityStepContextExecutionResult
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
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId)
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
                await this.elasticsearchCourseBuildService.buildIndexById(
                    course.id,
                )
                resumeAfterEntityId = course.id
                break
            }
            case ChallengeEntity.name: {
                const challenge = await this.entityManager.findOne(
                    ChallengeEntity,
                    {
                        where: {
                            ...(
                                executionResult?.resumeAfterEntityId ? {
                                    id: MoreThan(executionResult.resumeAfterEntityId)
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
                await this.elasticsearchChallengeBuildService.buildIndexById(
                    challenge.id,
                )
                resumeAfterEntityId = challenge.id
                break
            }
            case ContentEntity.name: {
                const content = await this.entityManager.findOne(
                    ContentEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId)
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
                await this.elasticsearchContentBuildService.buildIndexById(
                    content.id,
                )
                resumeAfterEntityId = content.id
                break
            }
            
            case ModuleEntity.name: {
                const module = await this.entityManager.findOne(
                    ModuleEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId)
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
                await this.elasticsearchModuleBuildService.buildIndexById(
                    module.id,
                )
                resumeAfterEntityId = module.id
                break
            }
            case FoundationCategoryEntity.name: {
                const category = await this.entityManager.findOne(
                    FoundationCategoryEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId)
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!category) {
                    done = true
                    break
                }
                await this.elasticsearchFoundationCategoryBuildService.buildIndexById(
                    category.id,
                )
                resumeAfterEntityId = category.id
                break
            }
            case FoundationEntity.name: {
                const foundation = await this.entityManager.findOne(
                    FoundationEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId)
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!foundation) {
                    done = true
                    break
                }
                await this.elasticsearchFoundationBuildService.buildIndexById(
                    foundation.id,
                )
                resumeAfterEntityId = foundation.id
                break
            }
            case HeadhuntingCompanyEntity.name: {
                const company = await this.entityManager.findOne(
                    HeadhuntingCompanyEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId),
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!company) {
                    done = true
                    break
                }
                await this.elasticsearchHeadhunterCompanyBuildService.buildIndexById(
                    company.id,
                )
                resumeAfterEntityId = company.id
                break
            }
            case ConsultantEntity.name: {
                const consultant = await this.entityManager.findOne(
                    ConsultantEntity,
                    {
                        where: {
                            ...(executionResult?.resumeAfterEntityId ? {
                                id: MoreThan(executionResult.resumeAfterEntityId),
                            } : {
                            }),
                            updatedAt: LessThanOrEqual(payload.syncAt.toDate()),
                        },
                        order: {
                            id: "ASC",
                        },
                    },
                )
                if (!consultant) {
                    done = true
                    break
                }
                await this.elasticsearchHeadhunterBuildService.buildIndexById(
                    consultant.id,
                )
                resumeAfterEntityId = consultant.id
                break
            }
            }
            await this.jobActionService.saveExecutionResult(
                {
                    job: context.job,
                    key: this.stepContextKey,
                    executionResult: {
                        resumeAfterEntityId,
                    },
                }
            )
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
