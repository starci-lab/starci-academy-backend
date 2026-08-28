import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    SubmissionCompletionNotifierService,
} from "./submission-completion-notifier.service"
import {
    LegacyCreditChargeService,
} from "./legacy-credit-charge.service"
import {
    resolveChargedUserId,
} from "./utils/resolve-charged-user-id"
import type {
    GrantChallengePassRewardParams,
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
    /** Immutable attempt prepared before queue publication. */
    attemptId?: string
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
        protected readonly progressProjectionService: ProgressProjectionService,
        protected readonly challengeProgressService: ChallengeProgressService,
        protected readonly submissionCompletionNotifierService: SubmissionCompletionNotifierService,
        protected readonly legacyCreditChargeService: LegacyCreditChargeService,
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

        await this.legacyCreditChargeService.chargeLegacyCreditIfNeeded({
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
            await this.submissionCompletionNotifierService.notifyLearnerOfCompletion({
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
            },
        )
        if (existing && (
            payload.attemptId === undefined
            || existing.processedAt
            || (existing.finalizationRevision ?? 0) > 0
        )) {
            await this.jobActionService.saveResultRef({
                job,
                kind: "challenge-submission-attempt",
                id: existing.id,
                entityManager,
            })
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
        const finalization = {
            submissionUrl:
                extended?.userChallengeSubmission.submissionUrl ?? existing?.submissionUrl ?? "",
            processedAt: this.dayjsService.now().toDate(),
            score: grade.evaluation.score,
            shortFeedback: grade.evaluation.shortFeedback,
            servedModel: grade.aiUsage?.model ?? null,
            servedProvider: grade.aiUsage?.provider ?? null,
            promptTokens: grade.aiUsage?.promptTokens ?? null,
            completionTokens: grade.aiUsage?.completionTokens ?? null,
            defaultLocale: payload.locale ?? Locale.En,
            feedbacks,
            status: grade.passed ? "passed" as const : "needs_revision" as const,
            platformDecision: grade.passed ? "passed" as const : "needs_revision" as const,
            confidence: grade.evaluation.confidence ?? 1,
            uncertainty: null,
            nextAction: grade.passed
                ? "Continue to the next course activity."
                : "Review the criterion feedback and create a new draft revision.",
            finalizationRevision: 1,
            aiAdvisoryEvidence: {
                score: grade.evaluation.score,
                details: grade.evaluation.details,
                servedModel: grade.aiUsage?.model ?? null,
                servedProvider: grade.aiUsage?.provider ?? null,
            },
        }
        /** Finalize the prepared attempt, or create one for a legacy queued job. */
        const attempt = await entityManager.save(
            UserChallengeSubmissionAttemptEntity,
            existing
                ? Object.assign(existing,
                    finalization)
                : {
                    idempotencyKey: job.id,
                    userChallengeSubmission: {
                        id: payload.userChallengeSubmissionId,
                    },
                    attemptNumber: numAttempts + 1,
                    draftRevision: 0,
                    submittedAt: this.dayjsService.now().toDate(),
                    ...finalization,
                },
        )
        await this.jobActionService.saveResultRef({
            job,
            kind: "challenge-submission-attempt",
            id: attempt.id,
            entityManager,
        })
        /** Resolve who is being charged (the credit debit + history row are
         * written by the after-commit fallback below, via the SAME
         * `AiEntitlementService.consume` every other grading surface uses --
         * see the V2 grade-step, which is the common path and already
         * charged before this step ran). */
        const chargedUserId = await resolveChargedUserId(
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

}
