import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    enqueueSubmissionResultEmail,
} from "@modules/integrations/transactional-email/submission-result-email"
import {
    resolveChargedUserId,
} from "./utils/resolve-charged-user-id"
import type {
    AbstractSubmissionCompletionGradeResult,
    AbstractSubmissionCompletionPayload,
} from "./abstract-submission-complete-step.service"
import type {
    NotifySubmissionCompletionParams,
} from "./types/complete"

@Injectable()
/**
 * Owns the learner-facing side effect of a graded challenge-submission completion: the
 * result email plus the in-app "graded" notification.
 *
 * Always invoked by {@link AbstractSubmissionCompleteStepService} AFTER its completion
 * transaction has already committed, so this reads/writes on its OWN injected (non-
 * transactional) entity manager -- never a caller-supplied transactional one. Best-effort:
 * the email helper never throws, and the in-app notification failure is caught + logged --
 * neither can fail the already-committed grading job.
 */
export class SubmissionCompletionNotifierService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
        private readonly winstonService: WinstonService,
    ) {
    }

    /**
     * Send the graded-result email and in-app notification for a newly created attempt.
     * @param params - The payload, job (for log correlation), queue name, and validated grade.
     */
    async notifyLearnerOfCompletion<
        TPayload extends AbstractSubmissionCompletionPayload,
        TGrade extends AbstractSubmissionCompletionGradeResult,
    >(
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
            const notifiedUserId = await resolveChargedUserId(
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
                    // this collaborator only ever backs the shared "complete" step
                    // (stepIndex 1) of the git/Google-Docs submission pipelines.
                    step: "complete",
                    stepIndex: 1,
                    payload,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            )
        }
    }
}
