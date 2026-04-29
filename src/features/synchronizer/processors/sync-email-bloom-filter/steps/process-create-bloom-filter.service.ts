import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    JobExtendedContext,
    AbstractStepService,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ScalableBloomFilter 
} from "bloom-filters"
import {
    BloomFilterType, CacheService 
} from "@modules/cache"
import {
    CacheKey 
} from "@modules/cache"
import type { 
    ProcessEmailBloomFilterStepExecuteResult 
} from "../types"
import {
    EmptyObject,
} from "@modules/common"

/**
 * Step 1: Create the bloom filter and persist it to the cache if it doesn't exist.
 */
@Injectable()
export class ProcessCreateBloomFilterStepService extends AbstractStepService<
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

    stepIndex = 0
    stepName = "create-bloom-filter"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute()
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
    ): Promise<ProcessEmailBloomFilterStepExecuteResult> {
        const cached = await this.cacheService.get(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
            }
        )
        if (cached) {
            return {
                isEmailBloomFilterReady: true,
            }
        }
        const scalableBloomFilter = new ScalableBloomFilter()
        await this.cacheService.set(
            {
                key: CacheKey.BloomFilter,
                args: [BloomFilterType.Email],
                cacheResult: {
                    scalableBloomFilter,
                },
            }
        )
        return {
            isEmailBloomFilterReady: false,
        }
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: ProcessEmailBloomFilterStepExecuteResult,
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
