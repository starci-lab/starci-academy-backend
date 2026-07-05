import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    CvGenerationStatus,
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import type {
    QueryDeepPartialEntity,
} from "typeorm/query-builder/QueryPartialEntity"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    JobFencedOutException,
} from "@modules/exceptions"
import type {
    ExtendedGenerateCvContext,
    GenerateCvComposeStepExecuteResult,
    GenerateCvRenderStepExecuteResult,
} from "../types"

/**
 * Step 4 — complete. ATOMICALLY finalizes the run: reads the compose (structured
 * data) + render (latex/pdf cdn keys) results, then in ONE transaction updates
 * the `cv_generations` row (created `Pending` at enqueue time) to `Done` with
 * its `structuredData` / `latexCdnKey` / `generatedPdfCdnKey` / `processedAt`,
 * and advances the job step — fenced so a stalled re-dispatch (a newer worker
 * owns the job) rolls back instead of double-writing. `score` / `feedback` are
 * already persisted by the preceding score step (index 3).
 */
@Injectable()
export class GenerateCvCompleteStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    stepIndex = 4
    stepName = "complete"

    /**
     * Process the complete step.
     */
    async process(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        const {
            payload,
            job,
            queueName,
        } = context

        // load the two upstream results the finalize depends on
        const composed = await this.jobActionService.loadExecutionResult<
            GenerateCvComposeStepExecuteResult
        >({
            job,
            key: "compose",
        })
        const rendered = await this.jobActionService.loadExecutionResult<
            GenerateCvRenderStepExecuteResult
        >({
            job,
            key: "render",
        })
        if (!composed || !rendered?.latexCdnKey) {
            throw new Error("Missing compose/render execution result for CV complete step")
        }

        try {
            await this.entityManager.transaction(
                async (entityManager) => {
                    // mark the generation Done with its structured data + latex key, in
                    // the SAME tx as the step advance so a crash can't leave a
                    // completed generation on an unadvanced job (or vice-versa)
                    await entityManager.update(
                        UserCvGenerationEntity,
                        {
                            id: payload.cvGenerationId,
                        },
                        // cast the whole partial: TypeORM's QueryDeepPartialEntity treats the
                        // jsonb `structuredData` (a `Record<string, unknown>`) as a nested
                        // deep-partial, so the plain object needs an explicit cast.
                        {
                            status: CvGenerationStatus.Done,
                            structuredData: composed as unknown as Record<string, unknown>,
                            latexCdnKey: rendered.latexCdnKey,
                            generatedPdfCdnKey: rendered.pdfCdnKey,
                            processedAt: this.dayjsService.now().toDate(),
                            errorMessage: null,
                        } as QueryDeepPartialEntity<UserCvGenerationEntity>,
                    )
                    // fence: advance only if this worker still owns the job
                    await this.jobActionService.increaseJob(
                        {
                            job,
                            entityManager,
                            expectedFencingToken: job.fencingToken,
                        },
                    )
                    await this.jobActionService.saveExecutionResult(
                        {
                            job,
                            key: this.stepName,
                            executionResult: {
                            },
                            entityManager,
                        },
                    )
                },
            )
        } catch (error) {
            // a newer worker fenced this one out — its tx rolled back; the new
            // owner finishes the job. Treat as idempotent no-op.
            if (error instanceof JobFencedOutException) {
                return
            }
            throw error
        }

        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
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
