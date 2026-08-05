import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
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
    CvGenerationStepResultMissingException,
} from "@modules/exceptions"
import {
    CvScoringService,
} from "../../shared/cv-scoring"
import type {
    CvTemplateLevel,
} from "../../shared/cv-scoring"
import type {
    ExtendedGenerateCvContext,
    GenerateCvComposeStepExecuteResult,
    GenerateCvGatherStepExecuteResult,
    GenerateCvScoreStepExecuteResult,
} from "../types"

@Injectable()
/**
 * Step 3 — score. Grades the freshly composed CV with the SOURCE-AGNOSTIC
 * {@link CvScoringService} (the same service the upload path will call in WF-03c)
 * and writes the resulting `score` + `feedback` onto the unified `cv_generations`
 * row, then advances the step. Scoring is best-effort: an AI/parse failure logs +
 * leaves `score`/`feedback` null (the generation itself already succeeded — a
 * scoring miss must not fail the whole job or lose the rendered CV).
 */
export class GenerateCvScoreStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly cvScoringService: CvScoringService,
    ) {
        super()
    }

    stepIndex = 3
    stepName = "score"

    /**
     * Process the score step.
     */
    async process(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
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
                    error: error.message,
                },
            )
            throw error
        }
    }

    /**
     * Execute: load the composed CV, score it via the shared service, persist the
     * score + feedback onto the row. Scoring failure degrades to null score.
     */
    private async execute(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<GenerateCvScoreStepExecuteResult> {
        const { payload, job } = context

        const composed = await this.jobActionService.loadExecutionResult<
            GenerateCvComposeStepExecuteResult
        >({
            job,
            key: "compose",
        })
        if (!composed) {
            throw new CvGenerationStepResultMissingException({
                step: "compose",
                stage: "score",
            })
        }
        // gather result is advisory here (level inference only) — its absence must
        // not fail scoring, so `mid` is the fallback rubric level.
        const gathered = await this.jobActionService.loadExecutionResult<
            GenerateCvGatherStepExecuteResult
        >({
            job,
            key: "gather",
        })

        const templateLevel = this.inferTemplateLevel(gathered)

        let result: GenerateCvScoreStepExecuteResult
        try {
            // SOURCE-AGNOSTIC call: feed the composed CV JSON as `structuredData`.
            // WF-07: the uploaded-into-unified path is the sibling
            // `ScoreUploadedCvService.scoreUploadedCv` (shared/cv-scoring) — it
            // buffers `uploadedCdnKey`, extracts text, and calls the SAME
            // `cvScoringService.score({ userId, cvText, ... })` via the `cvText`
            // branch, persisting onto the same `cv_generations` row (identical
            // write below). This generate step stays `structuredData`-only.
            const scored = await this.cvScoringService.score({
                userId: payload.userId,
                structuredData: composed as unknown as Record<string, unknown>,
                templateLevel,
                ...(payload.locale !== undefined ? {
                    locale: payload.locale,
                } : {
                }),
                ...(payload.ai !== undefined ? {
                    selection: payload.ai,
                } : {
                }),
            })
            result = {
                score: scored.score,
                feedback: scored.feedback,
            }
        } catch (error) {
            // scoring is advisory relative to generation — never lose the rendered
            // CV over a grade failure. Log + persist null; the CV still completes.
            this.winstonService.log(
                WinstonLog.ProcessCVSubmissionStepExecuted,
                {
                    jobId: job.id ?? "",
                    queueName: context.queueName,
                    step: this.stepName,
                    stepIndex: this.stepIndex,
                    payload,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            )
            result = {
                score: null,
                feedback: null,
            }
        }

        await this.entityManager.update(
            UserCvGenerationEntity,
            {
                id: payload.cvGenerationId,
            },
            {
                score: result.score,
                feedback: result.feedback,
            } as QueryDeepPartialEntity<UserCvGenerationEntity>,
        )

        return result
    }

    /**
     * Infer the rubric seniority level from the verified achievement volume
     * (mirrors the compose step's `inferLevel` bands). Missing gather data →
     * `mid` (the default rubric bar).
     */
    private inferTemplateLevel(
        gathered: GenerateCvGatherStepExecuteResult | null,
    ): CvTemplateLevel {
        if (!gathered) {
            return "mid"
        }
        const totalXp = gathered.xp.challengeXp
            + gathered.xp.milestoneXp
            + gathered.xp.codingXp
            + gathered.xp.lessonXp
        const capstones = gathered.milestoneTaskAttempts.length
        if (capstones >= 10 || totalXp >= 5000) {
            return "senior"
        }
        if (capstones >= 3 || totalXp >= 1500) {
            return "mid"
        }
        return "junior"
    }

    /**
     * Persist the score result as this step's execution result + advance the step.
     */
    private async finalize(
        executionResult: GenerateCvScoreStepExecuteResult,
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
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
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
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
