import type {
    SyncCdnPayload,
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
    sleep,
} from "@modules/common"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    ModuleEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    LessThanOrEqual,
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    CdnCourseBuildService,
    CdnChallengeBuildService,
    CdnContentBuildService,
    CdnLessonVideoBuildService,
    CdnModuleBuildService,
} from "../builder"
import type {
    SyncCdnEntityStepContextExecutionResult,
} from "../types"

/**
 * Step 0: run the CDN `process()` for the target entity.
 */
@Injectable()
export class ProcessCdnEntityStepService extends AbstractStepService<
    SyncCdnPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly cdnCourseBuildService: CdnCourseBuildService,
        private readonly cdnChallengeBuildService: CdnChallengeBuildService,
        private readonly cdnContentBuildService: CdnContentBuildService,
        private readonly cdnLessonVideoBuildService: CdnLessonVideoBuildService,
        private readonly cdnModuleBuildService: CdnModuleBuildService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "sync-cdn-entity"
    stepContextKey = "sync-cdn-entity-step-context"

    /** Process the step. */
    async process(
        context: JobExtendedContext<SyncCdnPayload, EmptyObject>,
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
        context: JobExtendedContext<SyncCdnPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        let done = false
        let resumeAfterEntityId: string | null = null
        while (!done) {
            const executionResult = await this.jobActionService.loadExecutionResult<
                SyncCdnEntityStepContextExecutionResult
            >(
                {
                    job: context.job,
                    key: this.stepContextKey,
                }
            )
            const { payload } = context
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
                    await this.cdnCourseBuildService.materializeAndUpload(
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
                    if (!challenge) {
                        done = true
                        break
                    }
                    await this.cdnChallengeBuildService.materializeAndUpload(
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
                    await this.cdnContentBuildService.materializeAndUpload(
                        content.id,
                    )
                    resumeAfterEntityId = content.id
                    break
                }
                case LessonVideoEntity.name: {
                    const lessonVideo = await this.entityManager.findOne(
                        LessonVideoEntity,
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
                    if (!lessonVideo) {
                        done = true
                        break
                    }
                    await this.cdnLessonVideoBuildService.materializeAndUpload(
                        lessonVideo.id,
                    )
                    resumeAfterEntityId = lessonVideo.id
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
                    await this.cdnModuleBuildService.materializeAndUpload(
                        module.id,
                    )
                    resumeAfterEntityId = module.id
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
            await sleep(100)
        }
        return {
        }
    }

    /**
     * Build per-locale entity JSON, skip when the Minio snapshot hash is unchanged, upload by id and display id.
     */


    /** Finalize the step. */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<SyncCdnPayload, EmptyObject>,
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
