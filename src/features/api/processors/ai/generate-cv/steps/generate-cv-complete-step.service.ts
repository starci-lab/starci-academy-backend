import type {
    GenerateCvPayload,
} from "@modules/integrations/bullmq/types/payloads/generate-cv"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    toUnknownRecord,
} from "@modules/lib/common/utils/unknown-record"
import {
    CvGenerationStepResultMissingException,
} from "@modules/platform/exceptions/errors/cv/cv-generation-step-result-missing"
import {
    JobFencedOutException,
} from "@modules/platform/exceptions/errors/job/not-found"
import type {
    GenerateCvComposeStepExecuteResult,
    GenerateCvRenderStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedGenerateCvContext,
} from "../types/extended"

@Injectable()
/**
 * Step 4 -- complete. ATOMICALLY finalizes the run: reads the compose (structured
 * data) + render (latex/pdf cdn keys) results, then in ONE transaction updates
 * the `cv_generations` row (created `Pending` at enqueue time) to `Done` with
 * its `structuredData` / `latexCdnKey` / `generatedPdfCdnKey` / `processedAt`,
 * and advances the job step -- fenced so a stalled re-dispatch (a newer worker
 * owns the job) rolls back instead of double-writing. `score` / `feedback` are
 * already persisted by the preceding score step (index 3).
 */
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
        if (!composed) {
            throw new CvGenerationStepResultMissingException({
                step: "compose",
                stage: "complete",
            })
        }
        if (!rendered?.latexCdnKey) {
            throw new CvGenerationStepResultMissingException({
                step: "render",
                stage: "complete",
            })
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
                            structuredData: toUnknownRecord(composed),
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
            // a newer worker fenced this one out -- its tx rolled back; the new
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
