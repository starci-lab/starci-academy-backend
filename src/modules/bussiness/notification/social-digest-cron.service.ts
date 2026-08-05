import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Cron,
    CronExpression,
} from "@nestjs/schedule"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    NotificationEntity,
    NotificationType,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"
import {
    SocialDigestFailedException,
} from "@modules/exceptions"
import {
    EnqueueSendMailJobService,
} from "../jobs"

/** One grouped `(recipient, type) → count` row from the digest aggregation query. */
interface DigestCountRow {
    userId: string
    type: NotificationType
    count: string
}

/** Window the digest looks back over (last 24 hours). */
const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000

@Injectable()
/**
 * Daily activity-digest cron. Once a day it aggregates every recipient's in-app
 * notifications from the last 24 hours (new followers, replies, community
 * activity, …) and sends ONE summary email per user — only to users who still
 * have {@link UserEntity.emailDigestEnabled} on and who actually have activity.
 *
 * Recipient-correct by construction: it reads {@link NotificationEntity}, whose
 * rows are already keyed to the recipient `user`, so it never mis-attributes an
 * actor's feed item. Best-effort: any failure is logged and swallowed so a bad
 * run can never crash the scheduler, and per-user mail failures never abort the
 * sweep. Idempotent enough in practice: it runs once a day on a fixed window.
 */
export class SocialDigestCronService {
    /** Logger scoped to this service for easy grep of digest runs. */
    private readonly logger = new Logger(SocialDigestCronService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {}

    /**
     * Send the daily digests (08:00 Asia/Ho_Chi_Minh — morning, after the night's
     * activity settled). Aggregates per recipient, then enqueues one email each.
     */
    @Cron(
        CronExpression.EVERY_DAY_AT_8AM,
        {
            name: "social-activity-digest",
            timeZone: "Asia/Ho_Chi_Minh",
        },
    )
    async sendDailyDigests(): Promise<void> {
        try {
            const since = new Date(Date.now() - DIGEST_WINDOW_MS)
            // one grouped query: notifications in the window for opted-in recipients
            const rows = await this.entityManager
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
                .where("n.created_at >= :since",
                    {
                        since,
                    })
                .andWhere("u.email_digest_enabled = true")
                .andWhere("u.is_deleted = false")
                .groupBy("n.user_id")
                .addGroupBy("n.type")
                .getRawMany<DigestCountRow>()

            // fold the (user, type) rows into one summary per user
            const perUser = new Map<string, { total: number; byType: Map<NotificationType, number> }>()
            for (const row of rows) {
                const count = Number.parseInt(row.count,
                    10)
                if (!Number.isFinite(count) || count <= 0) {
                    continue
                }
                const entry = perUser.get(row.userId) ?? {
                    total: 0,
                    byType: new Map<NotificationType, number>(),
                }
                entry.total += count
                entry.byType.set(row.type,
                    (entry.byType.get(row.type) ?? 0) + count)
                perUser.set(row.userId,
                    entry)
            }

            // one best-effort email per user with activity — a single
            // enqueue failure must never abort the sweep for the OTHER
            // recipients still waiting in the loop (mirrors
            // PublicRagPlaygroundCleanupService.dropSession's per-item isolation)
            let sentCount = 0
            for (const [userId,
                summary] of perUser) {
                const followers = summary.byType.get(NotificationType.NewFollower) ?? 0
                const replies =
                    (summary.byType.get(NotificationType.CommentReply) ?? 0) +
                    (summary.byType.get(NotificationType.CommunityReply) ?? 0)
                try {
                    await enqueueLearnerEmail({
                        entityManager: this.entityManager,
                        enqueueSendMailJobService: this.enqueueSendMailJobService,
                        userId,
                        template: "activity-digest",
                        webBaseUrl: envConfig().web.baseUrl,
                        subject: {
                            vi: `Bạn có ${summary.total} hoạt động mới`,
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
                    sentCount += 1
                } catch (error) {
                    // this user's enqueue failed — log and move on to the next
                    // recipient rather than aborting the whole sweep
                    const cause = error instanceof Error ? error : new Error(String(error))
                    this.logger.warn(
                        `Failed to enqueue activity digest for user ${userId}: ${cause.message}`,
                        cause.stack,
                    )
                }
            }
            this.logger.log(`Activity digest queued for ${sentCount}/${perUser.size} user(s)`)
        } catch (error) {
            // normalize, wrap in a typed exception so the failure is groupable
            // and observable, then log (message + stack) and swallow — a bad
            // run (e.g. a broken aggregation query) can never crash the
            // scheduler, and the next day self-heals
            const cause = error instanceof Error ? error : new Error(String(error))
            const exception = new SocialDigestFailedException({
                originalError: cause,
            })
            this.logger.error(exception.message,
                cause.stack)
        }
    }
}
