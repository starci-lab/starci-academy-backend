import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    CreditUsageService,
    EnqueueSendMailJobService,
    ProgressProjectionService,
    ChallengeProgressService,
    writeActivity,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    ActivityType,
    AiMode,
    ChallengeEntity,
    CreditUsageHistoryEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ModelProvider,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    XpSource,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiModelCatalogService,
    DEFAULT_MODEL_CREDIT,
    ModelRecommendation,
} from "@modules/ai"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryFailedError,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"
import {
    JobFencedOutException,
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    FLAT_POINTS,
    writeXpHistory,
} from "../../shared/xp"
import {
    enqueueSubmissionResultEmail,
} from "@modules/transactional-email"

/** Postgres unique-violation SQLSTATE — a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

/**
 * Step 1: finalize — load grade result, then ATOMICALLY persist the attempt + feedbacks,
 * the credit charge, the XP/points grant, and the job step advance in ONE transaction.
 * The attempt carries `idempotencyKey = job.id`, so a retried/stalled job cannot create a
 * second attempt or double-charge.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionCompleteStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly dayjsService: DayjsService,
        private readonly creditUsageService: CreditUsageService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly progressProjectionService: ProgressProjectionService,
        private readonly challengeProgressService: ChallengeProgressService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the step.
     * @param context - Context of the step.
     */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const {
            payload,
            job,
            queueName,
        } = context
        const grade = await this.jobActionService.loadExecutionResult<ProcessGoogleDocsSubmissionGradeStepExecuteResult>(
            {
                job,
                key: "grade",
            },
        )
        if (!grade) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        if (typeof grade.evaluation !== "object" || typeof grade.passed !== "boolean") {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }

        let chargedUserId: string | undefined
        let createdNewAttempt = false
        try {
            await this.entityManager.transaction(
                async (entityManager) => {
                    // idempotency: one attempt per grading job (atomic with the step advance below)
                    const existing = await entityManager.findOne(
                        UserChallengeSubmissionAttemptEntity,
                        {
                            where: {
                                idempotencyKey: job.id,
                            },
                            select: {
                                id: true,
                            },
                        },
                    )
                    if (existing) {
                        return
                    }
                    /** Sequence number for this attempt. */
                    const numAttempts = await entityManager.count(
                        UserChallengeSubmissionAttemptEntity,
                        {
                            where: {
                                userChallengeSubmission: {
                                    id: payload.userChallengeSubmissionId,
                                },
                            },
                        },
                    )
                    /** Flatten the grade detail feedbacks into attempt feedback rows. */
                    const feedbackRaws = grade.evaluation.details.map(
                        (detail) => {
                            return detail.feedbacks.map((feedback) => {
                                return {
                                    message: feedback.message,
                                    severity: feedback.severity,
                                    location: feedback.location,
                                    suggestion: feedback.suggestion,
                                }
                            })
                        }).flat()
                    const feedbacks = feedbackRaws.map(
                        (feedback, index) => {
                            return {
                                ...feedback,
                                orderIndex: index,
                                defaultLocale: payload.locale ?? Locale.En,
                            }
                        }
                    )
                    /** Persist the attempt, keyed by the job id for idempotency. */
                    const attempt = await entityManager.save(
                        UserChallengeSubmissionAttemptEntity,
                        {
                            idempotencyKey: job.id,
                            userChallengeSubmission: {
                                id: payload.userChallengeSubmissionId,
                            },
                            submissionUrl:
                                context.extended?.userChallengeSubmission.submissionUrl ?? "",
                            processedAt: this.dayjsService.now().toDate(),
                            score: grade.evaluation.score,
                            shortFeedback: grade.evaluation.shortFeedback,
                            attemptNumber: numAttempts + 1,
                            // Record WHICH AI model actually graded this attempt (Auto is
                            // load-balanced) so the submission result page can attribute it.
                            servedModel: grade.aiUsage?.model ?? null,
                            servedProvider: grade.aiUsage?.provider ?? null,
                            defaultLocale: payload.locale ?? Locale.En,
                            feedbacks,
                        }
                    )
                    createdNewAttempt = true
                    /** Record the AI credits charged for this grading run (same tx). */
                    chargedUserId = await this.recordCreditUsage(
                        {
                            entityManager,
                            payload,
                            attemptId: attempt.id,
                            servedModel: grade.aiUsage?.model,
                            servedProvider: grade.aiUsage?.provider,
                        },
                    )
                    /** Grant XP + reward points for a passed challenge (same tx, idempotent). */
                    if (grade.passed) {
                        const enrollment = await entityManager.findOne(
                            EnrollmentEntity,
                            {
                                where: {
                                    id: payload.enrollmentId,
                                },
                                // NOTE: `userId`/`courseId` are @RelationId virtual props
                                // (not real columns) — they CANNOT appear in `select`.
                                // Load the full row so @RelationId populates them.
                            },
                        )
                        if (enrollment) {
                            await writeXpHistory({
                                entityManager,
                                userId: enrollment.userId,
                                courseId: enrollment.courseId,
                                source: XpSource.Challenge,
                                amount: grade.evaluation.score,
                                points: FLAT_POINTS.challengePassed,
                                refId: attempt.id,
                            })
                            // home-feed activity for the pass (idempotent on user+challenge)
                            const userChallengeSubmission = await entityManager.findOne(
                                UserChallengeSubmissionEntity,
                                {
                                    where: {
                                        id: payload.userChallengeSubmissionId,
                                    },
                                    relations: {
                                        submission: {
                                            challenge: true,
                                        },
                                    },
                                },
                            )
                            const challenge = userChallengeSubmission?.submission?.challenge
                            if (challenge) {
                                await writeActivity({
                                    entityManager,
                                    userId: enrollment.userId,
                                    type: ActivityType.ChallengePassed,
                                    idempotencyKey: `challengePassed:${enrollment.userId}:${challenge.id}`,
                                    metadata: {
                                        target: {
                                            entityName: ChallengeEntity.name,
                                            id: challenge.id,
                                            label: challenge.title,
                                        },
                                    },
                                })
                            }
                            // refresh the progress projection in the SAME tx
                            await this.progressProjectionService.recompute({
                                userId: enrollment.userId,
                                courseId: enrollment.courseId,
                                entityManager,
                            })
                        }
                    }
                    /** Advance the step + persist the result ATOMICALLY with the side effects. */
                    await this.jobActionService.increaseJob(
                        {
                            job,
                            entityManager,
                            // fence: advance only if this worker still owns the job (zombie writes rejected)
                            expectedFencingToken: job.fencingToken,
                        }
                    )
                    await this.jobActionService.saveExecutionResult(
                        {
                            job,
                            key: this.stepName,
                            executionResult: {
                            },
                            entityManager,
                        }
                    )
                }
            )
        } catch (error) {
            // a concurrent duplicate lost the unique race → already graded; treat as idempotent.
            if (error instanceof QueryFailedError
                && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION) {
                return
            }
            // a newer worker fenced this one out — its tx rolled back; the new owner finishes the job.
            if (error instanceof JobFencedOutException) {
                return
            }
            throw error
        }

        // The V2 grade step already debited at invoke time (marker set); only debit here for the
        // legacy V1 grade path that does not charge up-front. Audit row is written either way (above).
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job,
            key: "creditCharged",
        })
        /** Debit credit pools AFTER commit, only when this run created the attempt and grade didn't charge. */
        if (createdNewAttempt && chargedUserId && !alreadyCharged) {
            const chargedMode = payload.ai?.mode ?? AiMode.Auto
            await this.aiEntitlementService.consume({
                userId: chargedUserId,
                mode: chargedMode,
                // charge by the model that actually served (catalog credit)
                cost: grade.aiUsage?.model
                    ? await this.aiModelCatalogService.creditForModel({
                        name: grade.aiUsage.model,
                        fallback: DEFAULT_MODEL_CREDIT,
                    })
                    : 0,
            })
            await this.creditUsageService.invalidate(chargedUserId)
        }

        this.winstonService.log(
            WinstonLog.ProcessGitSubmissionStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
        // Drop the cached challenge-progress projection for this enrollment NOW so the next read
        // recomputes the fresh aggregate. The projection cache lives ~5m; relying only on the
        // NATS-delivered ChallengeSubmissionProgressUpdated event to warm it leaves
        // "Kết quả của bạn" showing the stale pre-grade score for up to that TTL when the event
        // isn't delivered. The cache is shared Redis, so this worker-side invalidation is global.
        await this.challengeProgressService.invalidateProgress(payload.enrollmentId)
        this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })

        // Notify the learner of their graded result — only on the run that
        // actually created the attempt (idempotent: retries/duplicates skip it).
        // Best-effort: the helper never throws, so a mail failure can't fail the
        // already-committed grading job.
        if (createdNewAttempt) {
            await enqueueSubmissionResultEmail({
                entityManager: this.entityManager,
                enqueueSendMailJobService: this.enqueueSendMailJobService,
                userChallengeSubmissionId: payload.userChallengeSubmissionId,
                score: grade.evaluation.score,
                feedback: grade.evaluation.shortFeedback,
                webBaseUrl: envConfig().web.baseUrl,
                locale: payload.locale,
            })
        }
    }

    /**
     * Persist a {@link CreditUsageHistoryEntity} row for the grading run.
     * @param params - Transaction manager, job payload, and the saved attempt id.
     * @returns The id of the user that was charged.
     */
    private async recordCreditUsage(
        {
            entityManager,
            payload,
            attemptId,
            servedModel,
            servedProvider,
        }: {
            entityManager: EntityManager
            payload: ProcessGoogleDocsSubmissionPayload
            attemptId: string
            /** The model that actually served (Auto is load-balanced — record what ran). */
            servedModel?: string
            /** Provider of {@link servedModel}. */
            servedProvider?: ModelProvider
        },
    ): Promise<string> {
        /** Resolve who is being charged from the user challenge submission. */
        const userChallengeSubmission = await entityManager.findOneOrFail(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: payload.userChallengeSubmissionId,
                },
            },
        )
        /** The lane the user submitted on (defaults to the free Auto lane). */
        const mode = payload.ai?.mode ?? AiMode.Auto
        /** Recorded on the usage history for Premium spend attribution. */
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        // credits billed by the model that actually served (catalog credit)
        const credits = servedModel
            ? await this.aiModelCatalogService.creditForModel({
                name: servedModel,
                fallback: DEFAULT_MODEL_CREDIT,
            })
            : 0
        // Prefer the model that actually served (incl. the Auto-lane Qwen/economy pick);
        // fall back to the user-picked Premium/BYOK model.
        const pickedModel = servedModel
            ?? (payload.ai && payload.ai.mode !== AiMode.Auto
                ? payload.ai.model
                : null)
        const pickedProvider = servedProvider
            ?? (payload.ai && payload.ai.mode !== AiMode.Auto
                ? payload.ai.provider
                : null)
        // user_id is nullable after the enrollment-centric migration; an AI-graded
        // submission always has an owner — guard so the credit-usage write stays typed.
        const submissionUserId = userChallengeSubmission.userId
        if (!submissionUserId) {
            throw new Error("Cannot record credit usage: submission has no owner user")
        }
        await entityManager.save(
            CreditUsageHistoryEntity,
            {
                user: {
                    id: submissionUserId,
                },
                attempt: {
                    id: attemptId,
                },
                mode,
                recommendation: mode === AiMode.Premium ? recommendation : null,
                model: pickedModel,
                provider: pickedProvider,
                credits,
            },
        )
        return submissionUserId
    }
}
