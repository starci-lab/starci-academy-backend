import {
    Injectable,
} from "@nestjs/common"
import {
    Cron,
    CronExpression,
} from "@nestjs/schedule"
import {
    EntityManager,
    In,
    IsNull,
} from "typeorm"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import {
    SocialDigestFailedException,
} from "@modules/platform/exceptions/errors/notification/social-digest-failed"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnqueueSendMailJobService,
} from "../jobs/enqueue/send-mail.service"

/** One grouped `(recipient, type) -> count` row from the digest aggregation query. */
interface DigestCountRow {
    userId: string
    type: NotificationType
    count: string
    notificationIds: Array<string>
}

/** One recipient's folded activity summary across every notification type in the window. */
interface SocialDigestUserSummary {
    total: number
    byType: Map<NotificationType, number>
    notificationIds: Array<string>
}

/** Window the digest looks back over (last 24 hours). */
const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000

@Injectable()
/**
 * Daily activity-digest cron. Once a day it aggregates every recipient's in-app
 * notifications from the last 24 hours (new followers, replies, community
 * activity, ...) and sends ONE summary email per user -- only to users who still
 * have {@link UserEntity.emailDigestEnabled} on and who actually have activity.
 *
 * Recipient-correct by construction: it reads {@link NotificationEntity}, whose
 * rows are already keyed to the recipient `user`, so it never mis-attributes an
 * actor's feed item. Best-effort: any failure is logged and swallowed so a bad
 * run can never crash the scheduler, and per-user mail failures never abort the
 * sweep. A PostgreSQL advisory lock serializes replicas, while each included
 * notification receives a durable digest cursor so retries remain idempotent.
 */
export class SocialDigestCronService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly advisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Send the daily digests (08:00 Asia/Ho_Chi_Minh -- morning, after the night's
     * activity settled). Aggregates per recipient, then enqueues one email each.
     */
    @Cron(
        CronExpression.EVERY_DAY_AT_8AM,
        {
            name: "social-activity-digest",
            timeZone: "Asia/Ho_Chi_Minh",
            waitForCompletion: true,
        },
    )
    async sendDailyDigests(): Promise<void> {
        try {
            await this.entityManager.transaction(async (manager) => {
                // A database-scoped lock serializes every app replica. The
                // persisted `digestSentAt` cursor below handles later re-runs.
                await this.advisoryLockService.acquireXactLockByKey(
                    manager,
                    "scheduler:social-activity-digest",
                )
                const runAt = new Date(Date.now())
                const since = new Date(runAt.getTime() - DIGEST_WINDOW_MS)
                // Capture the exact row ids summarized. Marking by ids avoids
                // swallowing notifications inserted while this run is active.
                const rows = await manager
                    .createQueryBuilder(NotificationEntity,
                        "n")
                    .innerJoin("n.user",
                        "u")
                    .select("n.user_id",
                        "userId")
                    .addSelect("n.type",
                        "type")
                    .addSelect("COUNT(*)",
                        "count")
                    .addSelect("ARRAY_AGG(n.id)",
                        "notificationIds")
                    .where("n.created_at >= :since",
                        {
                            since,
                        })
                    .andWhere("n.digest_sent_at IS NULL")
                    .andWhere("u.email_digest_enabled = true")
                    .andWhere("u.is_deleted = false")
                    .groupBy("n.user_id")
                    .addGroupBy("n.type")
                    .getRawMany<DigestCountRow>()

                // fold the (user, type) rows into one summary per user
                const perUser = new Map<string, SocialDigestUserSummary>()
                for (const row of rows) {
                    const count = Number.parseInt(row.count,
                        10)
                    if (!Number.isFinite(count) || count <= 0) {
                        continue
                    }
                    const entry = perUser.get(row.userId) ?? {
                        total: 0,
                        byType: new Map<NotificationType, number>(),
                        notificationIds: [],
                    }
                    entry.total += count
                    entry.byType.set(row.type,
                        (entry.byType.get(row.type) ?? 0) + count)
                    entry.notificationIds.push(...row.notificationIds)
                    perUser.set(row.userId,
                        entry)
                }

                let sentCount = 0
                for (const [userId,
                    summary] of perUser) {
                    const followers = summary.byType.get(NotificationType.NewFollower) ?? 0
                    const replies =
                        (summary.byType.get(NotificationType.CommentReply) ?? 0) +
                        (summary.byType.get(NotificationType.CommunityReply) ?? 0)
                    const enqueued = await enqueueLearnerEmail({
                        entityManager: manager,
                        enqueueSendMailJobService: this.enqueueSendMailJobService,
                        userId,
                        template: "activity-digest",
                        webBaseUrl: envConfig().web.baseUrl,
                        subject: {
                            vi: `Bạn có ${summary.total} hoạt động mới`, // vn-ok: vi-locale string emitted to clients
                            en: `You have ${summary.total} new updates`,
                        },
                        extraContext: {
                            total: summary.total,
                            followers,
                            replies,
                            // link to the settings page where the digest can be turned off
                            settingsUrl: `${envConfig().web.baseUrl}/profile/settings`,
                        },
                    })
                    if (!enqueued) {
                        this.winstonService.log(WinstonLog.BestEffortOperationFailed,
                            {
                                op: "cron.social-digest.enqueue-failed",
                                userId,
                            })
                        continue
                    }
                    await manager.update(
                        NotificationEntity,
                        {
                            id: In(summary.notificationIds),
                            digestSentAt: IsNull(),
                        },
                        {
                            digestSentAt: runAt,
                        },
                    )
                    sentCount += 1
                }
                this.winstonService.log(WinstonLog.CronTickCompleted,
                    {
                        op: "cron.social-digest.completed",
                        count: sentCount,
                        meta: {
                            totalUsers: perUser.size,
                        },
                    })
            })
        } catch (error) {
            // normalize, wrap in a typed exception so the failure is groupable
            // and observable, then log (message + stack) and swallow -- a bad
            // run (e.g. a broken aggregation query) can never crash the
            // scheduler, and the next day self-heals
            const cause = error instanceof Error ? error : new Error(String(error))
            const exception = new SocialDigestFailedException({
                originalError: cause,
            })
            this.winstonService.log(WinstonLog.CronTickFailed,
                {
                    op: "cron.social-digest.failed",
                    error: exception.message,
                })
        }
    }
}
