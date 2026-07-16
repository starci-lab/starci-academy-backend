import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserStatsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserStatsParams,
    StreakDay,
    UserStatsResult,
} from "./types"
import {
    KPI_WEEK_START_SQL,
} from "./kpi-week.util"

/**
 * CQRS projection service for per-user social + inbox counters (follower /
 * following / unread). The COUNTs run ONLY in {@link recompute}, writing the
 * aggregate as a jsonb `value` keyed by `user_id`; {@link getStats} reads the
 * flat row with a TTL lazy-refresh and parses the jsonb into a typed view.
 */
@Injectable()
export class UserStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the stats row for ONE user (idempotent UPSERT).
     *
     * @param params - {@link RecomputeUserStatsParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // single scoped UPSERT building the aggregate jsonb from the source tables
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's stats from the projection (TTL lazy-refresh).
     *
     * @param userId - the user to read.
     * @returns typed counters parsed from the jsonb `value`.
     */
    async getStats(userId: string): Promise<UserStatsResult> {
        // first read of the flat projection row (PK is user_id)
        let row = await this.entityManager.findOne(
            UserStatsProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // TTL safety net: missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserStatsProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        // parse the jsonb value into the typed result (zeros for an absent row)
        const value = row?.value ?? {
        }
        return {
            followerCount: Number(value.followerCount) || 0,
            followingCount: Number(value.followingCount) || 0,
            unreadNotificationCount: Number(value.unreadNotificationCount) || 0,
            streak: Number(value.streak) || 0,
            longestStreak: Number(value.longestStreak) || 0,
            weeklyXp: Number(value.weeklyXp) || 0,
            weeklyLessons: Number(value.weeklyLessons) || 0,
            weeklyChallenges: Number(value.weeklyChallenges) || 0,
            weeklyCoding: Number(value.weeklyCoding) || 0,
            weeklyFlashcards: Number(value.weeklyFlashcards) || 0,
            weeklyMilestones: Number(value.weeklyMilestones) || 0,
            weeklyStudyDays: Number(value.weeklyStudyDays) || 0,
            weekResetAt: String(value.weekResetAt ?? ""),
            last7Days: Array.isArray(value.last7Days)
                ? (value.last7Days as Array<StreakDay>).map((day) => ({
                    date: String(day.date),
                    active: Boolean(day.active),
                }))
                : [],
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        // compare age against the env-tunable projection TTL
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the scoped user-stats UPSERT — the aggregate assembled into one jsonb
     * `value` for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_stats_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                -- incoming follow edges = followers
                'followerCount', COALESCE((
                    SELECT COUNT(*) FROM user_follows WHERE following_id = $1
                ), 0),
                -- outgoing follow edges = following
                'followingCount', COALESCE((
                    SELECT COUNT(*) FROM user_follows WHERE follower_id = $1
                ), 0),
                -- unread notifications drive the bell badge
                'unreadNotificationCount', COALESCE((
                    SELECT COUNT(*) FROM notifications
                    WHERE user_id = $1 AND read_at IS NULL
                ), 0),
                -- flat reward POINTS earned since the current KPI week started (the
                -- "this week" widget is a fair cross-course momentum number → sum
                -- points, the course-agnostic flat currency, NOT the weighted
                -- per-course xp). jsonb key kept as weeklyXp to avoid churning the
                -- GraphQL/FE contract; it now holds points. Rename to weeklyPoints
                -- when the FE label flips.
                'weeklyXp', COALESCE((
                    SELECT SUM(points) FROM xp_histories
                    WHERE user_id = $1 AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- lessons read since the current KPI week started (one row per first read)
                'weeklyLessons', COALESCE((
                    SELECT COUNT(*) FROM xp_histories
                    WHERE user_id = $1
                      AND source = 'lessonRead'
                      AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- challenges passed since the current KPI week started (xp source=challenge)
                'weeklyChallenges', COALESCE((
                    SELECT COUNT(*) FROM xp_histories
                    WHERE user_id = $1
                      AND source = 'challenge'
                      AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- coding problems accepted since the current KPI week started
                'weeklyCoding', COALESCE((
                    SELECT COUNT(*) FROM coding_submissions
                    WHERE user_id = $1
                      AND verdict = 'accepted'
                      AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- flashcards reviewed since the current KPI week started
                'weeklyFlashcards', COALESCE((
                    SELECT COUNT(*) FROM user_flashcard_reviews
                    WHERE user_id = $1
                      AND last_reviewed_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- personal-project milestone tasks passed since the current KPI week
                -- started (xp source=milestone — one row per passed user_milestone_task_attempt)
                'weeklyMilestones', COALESCE((
                    SELECT COUNT(*) FROM xp_histories
                    WHERE user_id = $1
                      AND source = 'milestone'
                      AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- distinct active days since the current KPI week started — a SEPARATE
                -- calendar-week count from last7Days below (that one stays a rolling
                -- 7-day window for the streak strip; this one resets Monday like every
                -- other weekly KPI).
                'weeklyStudyDays', COALESCE((
                    SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
                    FROM xp_histories
                    WHERE user_id = $1 AND created_at >= ${KPI_WEEK_START_SQL}
                ), 0),
                -- the NEXT KPI weekly reset instant (current week's start + 7 days),
                -- formatted as an unambiguous ISO-8601 UTC string ("Z" suffix) so
                -- FE's new Date(...) parses it identically in Node and the browser —
                -- FE computes the "resets in Xd Xh" countdown from this.
                'weekResetAt', to_char(
                    (${KPI_WEEK_START_SQL} + interval '7 days') AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                -- consecutive-day streak ending today: gaps-and-islands over the
                -- distinct active days. Subtracting the ascending row number from
                -- each day yields a constant "island" date per consecutive run; the
                -- current streak is the size of the island holding the latest day —
                -- but only when that latest day is today or yesterday (else broken).
                -- A day counts as active if it has an XP event OR a streak-freeze
                -- protected day (UNION) — protection is the only additive input.
                'streak', COALESCE((
                    WITH days AS (
                        SELECT created_at::date AS d
                        FROM xp_histories WHERE user_id = $1
                        UNION
                        SELECT spd.date AS d
                        FROM streak_protected_days spd WHERE spd.user_id = $1
                    ),
                    islands AS (
                        SELECT d, (d - (ROW_NUMBER() OVER (ORDER BY d))::int) AS island
                        FROM days
                    )
                    SELECT COUNT(*)::int FROM islands
                    WHERE island = (SELECT island FROM islands ORDER BY d DESC LIMIT 1)
                      AND (SELECT MAX(d) FROM days) >= CURRENT_DATE - 1
                ), 0),
                -- longest-ever streak: size of the biggest consecutive-day island
                -- (protected days UNIONed into the active-day set, same as above)
                'longestStreak', COALESCE((
                    WITH days AS (
                        SELECT created_at::date AS d
                        FROM xp_histories WHERE user_id = $1
                        UNION
                        SELECT spd.date AS d
                        FROM streak_protected_days spd WHERE spd.user_id = $1
                    ),
                    islands AS (
                        SELECT (d - (ROW_NUMBER() OVER (ORDER BY d))::int) AS island
                        FROM days
                    )
                    SELECT MAX(c)::int FROM (
                        SELECT COUNT(*) AS c FROM islands GROUP BY island
                    ) g
                ), 0),
                -- the last 7 calendar days (oldest→today) flagged active when the
                -- user earned any XP OR has a streak-freeze protected day → drives
                -- the streak strip
                'last7Days', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'date', to_char(gd, 'YYYY-MM-DD'),
                            'active', (EXISTS (
                                SELECT 1 FROM xp_histories x
                                WHERE x.user_id = $1 AND x.created_at::date = gd
                            ) OR EXISTS (
                                SELECT 1 FROM streak_protected_days spd
                                WHERE spd.user_id = $1 AND spd.date = gd::date
                            ))
                        ) ORDER BY gd
                    )
                    FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, interval '1 day') AS gd
                ), '[]'::jsonb)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
