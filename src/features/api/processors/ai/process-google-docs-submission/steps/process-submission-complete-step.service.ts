import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    CreditUsageService,
    ProgressProjectionService,
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
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    XpSource,
} from "@modules/databases"
import {
    AiEntitlementService,
    ModelRecommendation,
    resolveGradingCreditCost,
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
    writeXpHistory,
} from "../../shared/xp"

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
        private readonly progressProjectionService: ProgressProjectionService,
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
                                select: {
                                    id: true,
                                    userId: true,
                                    courseId: true,
                                },
                            },
                        )
                        if (enrollment) {
                            await writeXpHistory({
                                entityManager,
                                userId: enrollment.userId,
                                courseId: enrollment.courseId,
                                source: XpSource.Challenge,
                                amount: grade.evaluation.score,
                                points: grade.evaluation.score,
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
            const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
            await this.aiEntitlementService.consume({
                userId: chargedUserId,
                mode: chargedMode,
                cost: resolveGradingCreditCost({
                    mode: chargedMode,
                    recommendation,
                }),
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
        this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })
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
        }: {
            entityManager: EntityManager
            payload: ProcessGoogleDocsSubmissionPayload
            attemptId: string
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
        /** The premium tier billed comes from the configured model recommendation. */
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        const credits = resolveGradingCreditCost({
            mode,
            recommendation,
        })
        // Premium/BYOK carry the user-picked model; Auto is load-balanced and has none.
        const pickedModel = payload.ai && payload.ai.mode !== AiMode.Auto
            ? payload.ai.model
            : null
        const pickedProvider = payload.ai && payload.ai.mode !== AiMode.Auto
            ? payload.ai.provider
            : null
        await entityManager.save(
            CreditUsageHistoryEntity,
            {
                user: {
                    id: userChallengeSubmission.userId,
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
        return userChallengeSubmission.userId
    }
}
