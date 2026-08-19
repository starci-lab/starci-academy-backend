import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    DEFAULT_MODEL_CREDIT,
} from "@modules/ai/constants/credit-cost"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    QueryFailedError,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/platform/exceptions/errors/ai/missing-or-invalid-grade-execution-result"
import {
    JobFencedOutException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    SubmissionOwnerMissingException,
} from "@modules/platform/exceptions/errors/submission-review/submission-owner-missing"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import type {
    ChallengeEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/challenge-evaluation"
import {
    FLAT_POINTS,
} from "../xp/points-config"
import {
    writeXpHistory,
} from "../xp/write-xp-history"
import {
    enqueueSubmissionResultEmail,
} from "@modules/integrations/transactional-email/submission-result-email"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    ChargeLegacyCreditIfNeededParams,
    GrantChallengePassRewardParams,
    NotifySubmissionCompletionParams,
    PersistSubmissionCompletionParams,
    PersistSubmissionCompletionResult,
} from "./types/complete"

/** Postgres unique-violation SQLSTATE -- a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

/**
 * The minimal payload shape every challenge-submission completion reads. Both the git and
 * Google-Docs pipelines carry more fields than this (branch, lang, embedding overrides, ...) --
 * this only names what the shared completion logic itself touches.
 */
export interface AbstractSubmissionCompletionPayload {
    /** `enrollments.id`. */
    enrollmentId: string
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
    /** Locale hint for the persisted attempt/feedbacks and the result email. */
    locale?: Locale
}

/**
 * The minimal extended-context shape the shared completion logic reads: the resolved
 * submission URL, regardless of whether it points at a git repo or a Google Doc.
 */
export interface AbstractSubmissionCompletionExtended {
    userChallengeSubmission: {
        submissionUrl: string
    }
}

/**
 * The grade-step result shape the shared completion logic reads. Identical for both pipelines --
 * only how each pipeline PRODUCES the evaluation differs (repo RAG vs. Google Docs RAG).
 */
export interface AbstractSubmissionCompletionGradeResult {
    evaluation: ChallengeEvaluation
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}

/**
 * Shared "complete" step (stepIndex 1) for challenge-submission grading pipelines: load the
 * grade result, then ATOMICALLY persist the attempt + feedbacks, the credit charge, the XP/points
 * grant, and the job step advance in ONE transaction.
 *
 * The attempt carries `idempotencyKey = job.id` (one attempt per grading job): a retried or
 * stalled-re-dispatched job cannot create a second attempt or double-charge. Because the side
 * effects and the `currentStep` advance commit together, there is no window where a crash leaves
 * a charged-but-unadvanced job.
 *
 * This class holds everything that is genuinely identical in intent between the git-submission
 * and Google-Docs-submission pipelines once a grade result exists -- how that grade result was
 * PRODUCED (cloning a repo vs. fetching a doc) is a real difference and stays in each pipeline's
 * own grade step, not here.
 */
export abstract class AbstractSubmissionCompleteStepService<
    TPayload extends AbstractSubmissionCompletionPayload,
    TExtended extends AbstractSubmissionCompletionExtended,
    TGrade extends AbstractSubmissionCompletionGradeResult,
> extends AbstractStepService<TPayload, TExtended> {
    protected constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        protected readonly entityManager: EntityManager,
        protected readonly jobActionService: JobActionService,
        protected readonly winstonService: WinstonService,
        protected readonly eventEmitterService: EventEmitterService,
        protected readonly dayjsService: DayjsService,
        protected readonly aiEntitlementService: AiEntitlementService,
        protected readonly aiModelCatalogService: AiModelCatalogService,
        protected readonly progressProjectionService: ProgressProjectionService,
        protected readonly challengeProgressService: ChallengeProgressService,
        protected readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        protected readonly notificationService: NotificationService,
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
        context: JobExtendedContext<TPayload, TExtended>,
    ): Promise<void> {
        const {
            payload,
            job,
            queueName,
        } = context
        const grade = await this.jobActionService.loadExecutionResult<TGrade>(
            {
                job,
                key: "grade",
            },
        )
        this.assertValidGrade(grade)

        let createdNewAttempt = false
        let chargedUserId: string | undefined
        try {
            const result = await this.entityManager.transaction(
                (entityManager) => this.persistCompletionAtomically({
                    entityManager,
                    job,
                    payload,
                    extended: context.extended,
                    grade,
                }),
            )
            createdNewAttempt = result.createdNewAttempt
            chargedUserId = result.chargedUserId
        } catch (error) {
            if (this.isIdempotentCompletionRace(error)) {
                // a concurrent duplicate lost the unique race, or a newer worker fenced this
                // one out -- either way the job is already/being finished by someone else.
                return
            }
            throw error
        }

        await this.chargeLegacyCreditIfNeeded({
            job,
            grade,
            createdNewAttempt,
            chargedUserId,
        })

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
        if (createdNewAttempt) {
            await this.notifyLearnerOfCompletion({
                payload,
                job,
                queueName,
                grade,
            })
        }
    }

    /**
     * Decide whether `grade` is a usable execution result and throw the domain exception
     * when it is not.
     * @param grade - The step-0 execution result loaded for this job, if any.
     */
    private assertValidGrade(
        grade: TGrade | null,
    ): asserts grade is TGrade {
        if (!grade || typeof grade.evaluation !== "object" || typeof grade.passed !== "boolean") {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
    }

    /**
     * Decide whether a transaction failure means the completion already happened elsewhere
     * (a concurrent duplicate lost the unique race, or a newer worker fenced this one out and
     * rolled the transaction back) and can therefore be treated as an idempotent no-op.
     * @param error - The error the completion transaction threw.
     */
    private isIdempotentCompletionRace(error: unknown): boolean {
        if (error instanceof QueryFailedError
            && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION) {
            return true
        }
        return error instanceof JobFencedOutException
    }

    /**
     * ATOMICALLY persist the graded attempt, grant the pass reward, and advance the step --
     * all on the caller's transactional entity manager. Idempotent: one attempt per grading
     * job. If it already exists, a prior (atomic) run committed the attempt AND the step
     * advance together -- nothing left to do here.
     * @param params - The transaction manager plus everything needed to write the completion.
     * @returns Whether a new attempt was created, and who to charge for it.
     */
    private async persistCompletionAtomically(
        {
            entityManager,
            job,
            payload,
            extended,
            grade,
        }: PersistSubmissionCompletionParams<TPayload, TExtended, TGrade>,
    ): Promise<PersistSubmissionCompletionResult> {
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
            return {
                createdNewAttempt: false,
                chargedUserId: undefined,
            }
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
        const feedbackRaws = grade.evaluation.details.flatMap(
            (detail) => {
                return detail.feedbacks.map((feedback) => {
                    return {
                        message: feedback.message,
                        severity: feedback.severity,
                        location: feedback.location,
                        suggestion: feedback.suggestion,
                    }
                })
            })
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
                    extended?.userChallengeSubmission.submissionUrl ?? "",
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
        /** Resolve who is being charged (the credit debit + history row are
         * written by the after-commit fallback below, via the SAME
         * `AiEntitlementService.consume` every other grading surface uses --
         * see the V2 grade-step, which is the common path and already
         * charged before this step ran). */
        const chargedUserId = await this.resolveChargedUserId(
            entityManager,
            payload,
        )
        /** Grant XP + reward points for a passed challenge (same tx, idempotent). */
        if (grade.passed) {
            await this.grantChallengePassReward({
                entityManager,
                payload,
                attemptId: attempt.id,
                score: grade.evaluation.score,
            })
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
        return {
            createdNewAttempt: true,
            chargedUserId,
        }
    }

    /**
     * Grant the once-per-challenge XP/points reward and write the home-feed activity --
     * all on the caller's transaction. No-op when the enrollment is gone.
     * @param params - The transaction manager, payload, attempt id, and score to grant.
     */
    private async grantChallengePassReward(
        {
            entityManager,
            payload,
            attemptId,
            score,
        }: GrantChallengePassRewardParams<TPayload>,
    ): Promise<void> {
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
        if (!enrollment) {
            return
        }
        await writeXpHistory({
            entityManager,
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            source: XpSource.Challenge,
            amount: score,
            points: FLAT_POINTS.challengePassed,
            refId: attemptId,
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

    /**
     * Debit + record credit history AFTER commit, only for the legacy V1 grade path that
     * does not charge up-front (the V2 grade step already debited + recorded history at
     * invoke time -- marker set), and only when this run created the attempt.
     * @param params - The job (to check the charge marker), grade, and completion outcome.
     */
    private async chargeLegacyCreditIfNeeded(
        {
            job,
            grade,
            createdNewAttempt,
            chargedUserId,
        }: ChargeLegacyCreditIfNeededParams<TGrade>,
    ): Promise<void> {
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job,
            key: "creditCharged",
        })
        if (!createdNewAttempt || !chargedUserId || alreadyCharged) {
            return
        }
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

    /**
     * Send the graded-result email and in-app notification for a newly created attempt.
     * Best-effort: the email helper never throws, and the in-app notification failure is
     * caught + logged -- neither can fail the already-committed grading job.
     * @param params - The payload, job (for log correlation), and validated grade.
     */
    private async notifyLearnerOfCompletion(
        {
            payload,
            job,
            queueName,
            grade,
        }: NotifySubmissionCompletionParams<TPayload, TGrade>,
    ): Promise<void> {
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
        payload: TPayload,
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
