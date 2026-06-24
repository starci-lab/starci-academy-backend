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
@Injectable()
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

            // one best-effort email per user with activity
            for (const [userId,
                summary] of perUser) {
                const followers = summary.byType.get(NotificationType.NewFollower) ?? 0
                const replies =
                    (summary.byType.get(NotificationType.CommentReply) ?? 0) +
                    (summary.byType.get(NotificationType.CommunityReply) ?? 0)
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
            }
            this.logger.log(`Activity digest queued for ${perUser.size} user(s)`)
        } catch (error) {
            // normalize + log (message + stack) and swallow — next day self-heals
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(cause.message,
                cause.stack)
        }
    }
}
