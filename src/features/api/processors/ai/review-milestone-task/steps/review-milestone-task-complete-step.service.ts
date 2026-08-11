import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
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
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    DEFAULT_MODEL_CREDIT,
} from "@modules/ai/constants/credit-cost"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task-attempt.entity"
import {
    UserMilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task.entity"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
    ReviewMilestoneTaskGradeStepService,
} from "./review-milestone-task-grade-step.service"
import type {
    ReviewMilestoneTaskGradeResult,
} from "../types/grade"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/platform/exceptions/errors/ai/missing-or-invalid-grade-execution-result"
import {
    JobFencedOutException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    FLAT_POINTS,
} from "../../shared/xp/points-config"
import {
    writeXpHistory,
} from "../../shared/xp/write-xp-history"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import {
    ReviewMilestoneTaskCreditService,
} from "../review-milestone-task-credit.service"

/** Postgres unique-violation SQLSTATE -- a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

/** Per-course weighted XP granted once when a milestone task is first passed (matches leaderboard x10). */
const MILESTONE_PASS_XP = 10

@Injectable()
/**
 * Step 1: finalize -- load grade result, then ATOMICALLY persist the user-milestone-task,
 * its attempt, the XP/points grant, and the job step advance in ONE transaction. The attempt
 * carries `idempotencyKey = job.id`, so a retried/stalled job cannot create a duplicate attempt.
 */
export class ReviewMilestoneTaskCompleteStepService extends AbstractStepService<
    ReviewPersonalProjectTaskPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly gradeStepService: ReviewMilestoneTaskGradeStepService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly dayjsService: DayjsService,
        private readonly progressProjectionService: ProgressProjectionService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly creditService: ReviewMilestoneTaskCreditService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly notificationService: NotificationService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the review milestone task complete step.
     * @param context - The job extended context.
     */
    async process(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<void> {
        const {
            payload,
            job,
            queueName,
        } = context
        const grade = await this.jobActionService.loadExecutionResult<ReviewMilestoneTaskGradeResult>(
            {
                job,
                key: this.gradeStepService.stepName,
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

        const creditCost = grade.aiUsage?.model
            ? await this.aiModelCatalogService.creditForRun({
                name: grade.aiUsage.model,
                promptTokens: grade.aiUsage.promptTokens,
                completionTokens: grade.aiUsage.completionTokens,
                cachedTokens: grade.aiUsage.cachedTokens,
                fallback: DEFAULT_MODEL_CREDIT,
            })
            : 0

        let createdNewAttempt = false
        try {
            await this.entityManager.transaction(
                async (entityManager) => {
                    // idempotency: one attempt per review job (atomic with the step advance below)
                    const existing = await entityManager.findOne(
                        UserMilestoneTaskAttemptEntity,
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
                    /** Find or create the user milestone task. */
                    let userMilestoneTask = await entityManager.findOne(
                        UserMilestoneTaskEntity,
                        {
                            where: {
                                enrollment: {
                                    id: payload.enrollmentId,
                                },
                                milestoneTask: {
                                    id: payload.taskId,
                                },
                            },
                        },
                    )
                    if (!userMilestoneTask) {
                        userMilestoneTask = entityManager.create(
                            UserMilestoneTaskEntity,
                            {
                                enrollment: {
                                    id: payload.enrollmentId,
                                },
                                milestoneTask: {
                                    id: payload.taskId,
                                },
                            },
                        )
                        await entityManager.save(userMilestoneTask)
                    }
                    /** Sequence number for this attempt. */
                    const numAttempts = await entityManager.count(
                        UserMilestoneTaskAttemptEntity,
                        {
                            where: {
                                userMilestoneTask: {
                                    id: userMilestoneTask.id,
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
                    await entityManager.save(
                        UserMilestoneTaskAttemptEntity,
                        {
                            idempotencyKey: job.id,
                            userMilestoneTask: {
                                id: userMilestoneTask.id,
                            },
                            processedAt: this.dayjsService.now().toDate(),
                            score: grade.evaluation.score,
                            shortFeedback: grade.evaluation.shortFeedback,
                            passed: grade.passed,
                            attemptNumber: numAttempts + 1,
                            // Record WHICH AI model actually graded this attempt (Auto is
                            // load-balanced) so the task feedback page can attribute it.
                            servedModel: grade.aiUsage?.model ?? null,
                            servedProvider: grade.aiUsage?.provider ?? null,
                            promptTokens: grade.aiUsage?.promptTokens ?? null,
                            completionTokens: grade.aiUsage?.completionTokens ?? null,
                            feedbacks,
                            defaultLocale: payload.locale ?? Locale.En,
                        }
                    )
                    createdNewAttempt = true
                    /**
                     * Debit AFTER the attempt write to preserve the natural domain order, but
                     * on this SAME transaction. If debit throws, the attempt and every reward
                     * below roll back; a BullMQ retry sees no attempt and can safely try once.
                     */
                    const chargedEnrollment = await entityManager.findOneOrFail(
                        EnrollmentEntity,
                        {
                            where: {
                                id: payload.enrollmentId,
                            },
                        },
                    )
                    await this.creditService.consume(
                        entityManager,
                        {
                            userId: chargedEnrollment.userId,
                            cost: creditCost,
                            surface: AiCeilSurface.Grading,
                            task: AiModelTask.TaskGrading,
                            model: grade.aiUsage?.model ?? null,
                            provider: grade.aiUsage?.provider ?? null,
                            recommendation: null,
                            promptTokens: grade.aiUsage?.promptTokens ?? null,
                            completionTokens: grade.aiUsage?.completionTokens ?? null,
                            attempts: grade.aiUsage?.attempts ?? null,
                        },
                    )
                    /**
                     * Grant XP + reward points once when the task is passed. refId is the
                     * user-milestone-task id, so re-passing the same task never re-credits
                     * (mirrors the leaderboard's DISTINCT-task x10 count).
                     */
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
                                source: XpSource.Milestone,
                                amount: MILESTONE_PASS_XP,
                                points: FLAT_POINTS.milestonePassed,
                                refId: userMilestoneTask.id,
                            })
                            // home-feed activity for the pass (idempotent per user-milestone-task)
                            const milestoneTask = await entityManager.findOne(
                                MilestoneTaskEntity,
                                {
                                    where: {
                                        id: payload.taskId,
                                    },
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                            )
                            if (milestoneTask) {
                                await writeActivity({
                                    entityManager,
                                    userId: enrollment.userId,
                                    type: ActivityType.MilestonePassed,
                                    idempotencyKey: userMilestoneTask.id,
                                    metadata: {
                                        target: {
                                            entityName: MilestoneTaskEntity.name,
                                            id: milestoneTask.id,
                                            label: milestoneTask.title,
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
            // a concurrent duplicate lost the unique race -> already reviewed; treat as idempotent.
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
        this.eventEmitterService.emit(
            {
                event: EventName.MilestoneTaskProgressUpdated,
                payload: {
                    enrollmentId: payload.enrollmentId,
                },
            }
        )

        // Notify the learner -- only on the run that created the attempt (idempotent).
        if (createdNewAttempt) {
            const enrollment = await this.entityManager.findOne(
                EnrollmentEntity,
                {
                    where: {
                        id: payload.enrollmentId,
                    },
                    // NOTE: `userId` is a @RelationId virtual prop (not a real
                    // column) -- it CANNOT appear in `select`. Load the full row
                    // so @RelationId populates it.
                },
            )
            if (enrollment) {
                // this section runs OUTSIDE the grading transaction (gated only by
                // createdNewAttempt), so re-fetch the milestone task here rather
                // than relying on the tx-scoped lookup inside the `grade.passed` branch above
                const milestoneTask = await this.entityManager.findOne(
                    MilestoneTaskEntity,
                    {
                        where: {
                            id: payload.taskId,
                        },
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                )
                await enqueueLearnerEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: enrollment.userId,
                    template: "milestone-result",
                    locale: payload.locale,
                    webBaseUrl: envConfig().web.baseUrl,
                    subject: {
                        vi: "Task dự án cá nhân của bạn đã được chấm", // vn-ok: vi-locale string emitted to clients
                        en: "Your personal-project task was reviewed",
                    },
                    extraContext: {
                        score: grade.evaluation.score,
                        passed: grade.passed,
                        feedback: grade.evaluation.shortFeedback ?? "",
                    },
                })
                // a failed notification write must never crash grading -- the
                // attempt + email already landed; just log and move on
                try {
                    await this.notificationService.createNotification({
                        userId: enrollment.userId,
                        type: NotificationType.MilestoneGraded,
                        title: {
                            key: "notification.milestoneGraded.title",
                            params: {
                                title: milestoneTask?.title ?? "",
                                result: grade.passed ? "passed" : "failed",
                            },
                        },
                        target: milestoneTask
                            ? {
                                entityName: MilestoneTaskEntity.name,
                                id: milestoneTask.id,
                                label: milestoneTask.title,
                            }
                            : undefined,
                    })
                } catch (error) {
                    this.winstonService.log(
                        WinstonLog.ProcessStepExecuted,
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
    }
}
