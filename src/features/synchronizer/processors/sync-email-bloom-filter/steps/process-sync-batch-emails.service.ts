import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    EmailBloomFilterService,
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
    LessThanOrEqual,
    MoreThan,
} from "typeorm"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"
import {
    EmptyObject 
} from "@modules/common"
import {    
    CacheService 
} from "@modules/cache"
import {
    ProcessEmailBloomFilterStepExecuteResult,
    SyncEmailBloomFilterStepContextExecuteResult,
} from "../types"
import {
    ProcessCreateBloomFilterStepService 
} from "./process-create-bloom-filter.service"

/**
 * Step 2: Sync a batch of emails to the bloom filter.
 */
@Injectable()
export class ProcessSyncBatchEmailsStepService extends AbstractStepService<
    SyncEmailBloomFilterPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly cacheService: CacheService,
        private readonly processCreateBloomFilterStepService: ProcessCreateBloomFilterStepService,
        private readonly emailBloomFilterService: EmailBloomFilterService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "sync-batch-emails"
    stepContextKey = "sync-batch-emails-context"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
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

    /** Execute the step. */
    private async execute(
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >,
    ): Promise<EmptyObject> {
        const executionResult = await this.jobActionService.loadExecutionResult<
            ProcessEmailBloomFilterStepExecuteResult
        >(
            {
                job: context.job,
                key: this.processCreateBloomFilterStepService.stepName,
            }
        )
        const { isEmailBloomFilterReady } = executionResult
        if (!isEmailBloomFilterReady) {
            return {
            }
        }
        let done = false
        while (!done) {
            const contextExecuteResult = await this.jobActionService.loadExecutionResult<
            SyncEmailBloomFilterStepContextExecuteResult
            >(
                {
                    job: context.job,
                    key: this.stepContextKey,
                }
            )
            const users = await this.entityManager.find(
                UserEntity, 
                {
                    where: {
                        updatedAt: LessThanOrEqual(
                            context.payload.syncAt.toDate()
                        ),
                        ...(contextExecuteResult?.resumeAfterUserId ? 
                            {
                                id: MoreThan(contextExecuteResult.resumeAfterUserId),
                            }
                            : {
                            }
                        ),
                    },
                    order: {
                        id: "ASC",
                    },
                    take: envConfig().services.synchronizer.emailBloomFilter.process.batchSize,
                }
            )
            if (users.length === 0) {
                done = true
                break
            }
            await this.emailBloomFilterService.addMultiple(
                users.map((user) => user.email ?? "")
            )
            await this.jobActionService.saveExecutionResult({
                job: context.job,
                key: this.stepContextKey,
                executionResult: {
                    resumeAfterUserId: users[users.length - 1]?.id ?? null,
                },
                entityManager: this.entityManager,
            })
        }
        return {
        }
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
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
        })

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
