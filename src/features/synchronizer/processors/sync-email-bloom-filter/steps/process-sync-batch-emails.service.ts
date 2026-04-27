import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
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
    BloomFilterType, 
    CacheKey, 
    CacheService 
} from "@modules/cache"
import {
    CacheNotFoundException,
} from "@modules/exceptions"
import {
    SyncEmailBloomFilterStepContextExecuteResult 
} from "../types"

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
            // update the job status to failed
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
        let done = false
        while (!done) {
            const executionResult = await this.jobActionService.loadExecutionResult<
            SyncEmailBloomFilterStepContextExecuteResult
            >(
                {
                    job: context.job,
                    key: this.stepContextKey,
                }
            )
            const cached = await this.cacheService.get(
                {
                    key: CacheKey.BloomFilter,
                    args: [BloomFilterType.Email],
                }
            )
            if (!cached) {
                throw new CacheNotFoundException({
                    key: CacheKey.BloomFilter,
                    args: [BloomFilterType.Email],
                })
            }
            // Retrieve a batch of users from the database.
            const users = await this.entityManager.find(
                UserEntity, 
                {
                    where: {
                        updatedAt: LessThanOrEqual(
                            context.payload.syncAt.toDate()
                        ),
                        ...(executionResult?.resumeAfterUserId ? 
                            {
                                id: MoreThan(executionResult.resumeAfterUserId),
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
            /** Sync the emails to the bloom filter. */
            for (const user of users) {
                const email = user.email
                if (email) {
                    cached.scalableBloomFilter.add(email)
                }
            }
            await this.cacheService.set(
                {
                    key: CacheKey.BloomFilter,
                    args: [BloomFilterType.Email],
                    cacheResult: cached,
                }
            )
            /** Update the job context. */
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
