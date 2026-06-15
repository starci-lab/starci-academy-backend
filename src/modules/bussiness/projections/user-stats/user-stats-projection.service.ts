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
    UserStatsResult,
} from "./types"

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
            weeklyXp: Number(value.weeklyXp) || 0,
            weeklyLessons: Number(value.weeklyLessons) || 0,
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
                -- XP earned in the rolling 7-day window
                'weeklyXp', COALESCE((
                    SELECT SUM(amount) FROM xp_histories
                    WHERE user_id = $1 AND created_at >= now() - interval '7 days'
                ), 0),
                -- lessons read in the rolling 7-day window (one row per first read)
                'weeklyLessons', COALESCE((
                    SELECT COUNT(*) FROM xp_histories
                    WHERE user_id = $1
                      AND source = 'lessonRead'
                      AND created_at >= now() - interval '7 days'
                ), 0),
                -- consecutive-day streak ending today: gaps-and-islands over the
                -- distinct active days. Subtracting the ascending row number from
                -- each day yields a constant "island" date per consecutive run; the
                -- current streak is the size of the island holding the latest day —
                -- but only when that latest day is today or yesterday (else broken)
                'streak', COALESCE((
                    WITH days AS (
                        SELECT DISTINCT created_at::date AS d
                        FROM xp_histories WHERE user_id = $1
                    ),
                    islands AS (
                        SELECT d, (d - (ROW_NUMBER() OVER (ORDER BY d))::int) AS island
                        FROM days
                    )
                    SELECT COUNT(*)::int FROM islands
                    WHERE island = (SELECT island FROM islands ORDER BY d DESC LIMIT 1)
                      AND (SELECT MAX(d) FROM days) >= CURRENT_DATE - 1
                ), 0)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
