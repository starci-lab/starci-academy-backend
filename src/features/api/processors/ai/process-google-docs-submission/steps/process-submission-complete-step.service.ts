import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    EnqueueSendMailJobService,
    NotificationService,
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
    AiCeilSurface,
    AiModelTask,
    ChallengeEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    NotificationType,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    XpSource,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiModelCatalogService,
    DEFAULT_MODEL_CREDIT,
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
    SubmissionOwnerMissingException,
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

/** Postgres unique-violation SQLSTATE -- a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

@Injectable()
/**
 * Step 1: finalize -- load grade result, then ATOMICALLY persist the attempt + feedbacks,
 * the credit charge, the XP/points grant, and the job step advance in ONE transaction.
 * The attempt carries `idempotencyKey = job.id`, so a retried/stalled job cannot create a
 * second attempt or double-charge.
 */
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
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly progressProjectionService: ProgressProjectionService,
        private readonly challengeProgressService: ChallengeProgressService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
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
                            promptTokens: grade.aiUsage?.promptTokens ?? null,
                            completionTokens: grade.aiUsage?.completionTokens ?? null,
                            defaultLocale: payload.locale ?? Locale.En,
                            feedbacks,
                        }
                    )
                    createdNewAttempt = true
                    /** Resolve who is being charged (the credit debit + history row are
                     * written by the after-commit fallback below, via the SAME
                     * `AiEntitlementService.consume` every other grading surface uses --
                     * see the V2 grade-step, which is the common path and already
                     * charged before this step ran). */
                    chargedUserId = await this.resolveChargedUserId(
                        entityManager,
                        payload,
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
                                // (not real columns) -- they CANNOT appear in `select`.
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
            // a concurrent duplicate lost the unique race -> already graded; treat as idempotent.
            if (error instanceof QueryFailedError
                && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION) {
                return
            }
            // a newer worker fenced this one out -- its tx rolled back; the new owner finishes the job.
            if (error instanceof JobFencedOutException) {
                return
            }
            throw error
        }

        // The V2 grade step already debited (+ recorded history) at invoke time (marker
        // set); only debit here for the legacy V1 grade path that does not charge up-front.
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job,
            key: "creditCharged",
        })
        /** Debit + record history AFTER commit, only when this run created the attempt and grade didn't charge. */
        if (createdNewAttempt && chargedUserId && !alreadyCharged) {
            await this.aiEntitlementService.consume({
                userId: chargedUserId,
                // charge by the model that actually served (catalog credit)
                cost: grade.aiUsage?.model
                    ? await this.aiModelCatalogService.creditForRun({
                        name: grade.aiUsage.model,
                        promptTokens: grade.aiUsage.promptTokens,
                        completionTokens: grade.aiUsage.completionTokens,
                        cachedTokens: grade.aiUsage.cachedTokens,
                        fallback: DEFAULT_MODEL_CREDIT,
                    })
                    : 0,
                surface: AiCeilSurface.Grading,
                task: AiModelTask.ChallengeGrading,
                model: grade.aiUsage?.model ?? null,
                provider: grade.aiUsage?.provider ?? null,
                recommendation: null,
                promptTokens: grade.aiUsage?.promptTokens ?? null,
                completionTokens: grade.aiUsage?.completionTokens ?? null,
                attempts: grade.aiUsage?.attempts ?? null,
            })
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
        // "your result" showing the stale pre-grade score for up to that TTL when the event
        // isn't delivered. The cache is shared Redis, so this worker-side invalidation is global.
        await this.challengeProgressService.invalidateProgress(payload.enrollmentId)
        this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })

        // Notify the learner of their graded result -- only on the run that
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
            // Best-effort in-app notification -- a failure here can never fail the
            // already-committed grading job (mirrors the email best-effort above).
            try {
                const userChallengeSubmission = await this.entityManager.findOne(
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
                const notifiedUserId = await this.resolveChargedUserId(
                    this.entityManager,
                    payload,
                )
                await this.notificationService.createNotification({
                    userId: notifiedUserId,
                    type: NotificationType.ChallengeGraded,
                    title: {
                        key: "notification.challengeGraded.title",
                        params: {
                            title: challenge?.title ?? "",
                            result: grade.passed ? "passed" : "failed",
                        },
                    },
                    target: challenge
                        ? {
                            entityName: ChallengeEntity.name,
                            id: challenge.id,
                            label: challenge.title,
                        }
                        : undefined,
                })
            } catch (error) {
                this.winstonService.log(
                    WinstonLog.ProcessGitSubmissionStepExecuted,
                    {
                        jobId: job.id ?? "",
                        queueName,
                        step: this.stepName,
                        stepIndex: this.stepIndex,
                        payload,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    },
                )
            }
        }
    }

    /**
     * Resolve who is being charged from the user challenge submission -- the
     * actual debit + history row are written by {@link AiEntitlementService.consume}
     * (either at grade-step time, the common V2 path, or by this step's own
     * after-commit fallback for the legacy V1 path -- see {@link process}).
     * @param entityManager - Transaction manager.
     * @param payload - Job payload carrying the submission id.
     * @returns The id of the user to charge.
     */
    private async resolveChargedUserId(
        entityManager: EntityManager,
        payload: ProcessGoogleDocsSubmissionPayload,
    ): Promise<string> {
        const userChallengeSubmission = await entityManager.findOneOrFail(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: payload.userChallengeSubmissionId,
                },
            },
        )
        // user_id is nullable after the enrollment-centric migration; an AI-graded
        // submission always has an owner -- guard so the credit-usage write stays typed.
        const submissionUserId = userChallengeSubmission.userId
        if (!submissionUserId) {
            throw new SubmissionOwnerMissingException({
                userChallengeSubmissionId: payload.userChallengeSubmissionId,
            })
        }
        return submissionUserId
    }
}
