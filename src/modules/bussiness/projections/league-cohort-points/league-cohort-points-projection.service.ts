import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LeagueCohortPointsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    LeagueStandingMember,
} from "../../league/types"
import type {
    LeagueCohortMemberValue,
    RecomputeLeagueCohortParams,
} from "./types"

@Injectable()
/**
 * CQRS projection service for a league cohort's ranked week-points board. The
 * heavy `SUM(xp_histories.points)` GROUP BY over a cohort's members runs ONLY in
 * {@link recompute}, which folds the ranked members into the cohort row's jsonb
 * `value.members`. {@link getMembers} reads the flat row with a TTL lazy-refresh;
 * the CDC listener keeps it fresh as members earn points. The cohort's week
 * window is derived from `league_cohorts` inside recompute, so callers pass only
 * the cohort id.
 */
export class LeagueCohortPointsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert one cohort's ranked board (idempotent UPSERT).
     *
     * @param params - {@link RecomputeLeagueCohortParams}
     */
    async recompute(
        {
            cohortId,
            entityManager,
        }: RecomputeLeagueCohortParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                cohortId,
            ],
        )
    }

    /**
     * Read a cohort's ranked members (best → worst), TTL lazy-refreshed. Rank is
     * the 1-based position in the stored (pre-ordered) list.
     *
     * @param cohortId - the cohort to read.
     * @returns the ranked {@link LeagueStandingMember} list.
     */
    async getMembers(cohortId: string): Promise<Array<LeagueStandingMember>> {
        const value = await this.readValue(cohortId)
        const members = (value.members as Array<LeagueCohortMemberValue> | undefined) ?? []
        return members.map((member, index) => ({
            userId: member.userId,
            username: member.username,
            avatar: member.avatar,
            weekPoints: Number(member.weekPoints) || 0,
            rank: index + 1,
            // last-week baseline is not part of the cohort-points projection; the
            // league service merges it in to compute the real delta
            rankDelta: null,
        }))
    }

    /**
     * Read the cohort row's jsonb value, recomputing first when missing or stale
     * (TTL lazy-refresh).
     *
     * @param cohortId - the cohort to read.
     * @returns the jsonb value (empty object when still absent).
     */
    private async readValue(cohortId: string): Promise<Record<string, unknown>> {
        let row = await this.entityManager.findOne(
            LeagueCohortPointsProjectionEntity,
            {
                where: {
                    cohortId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                cohortId,
            })
            row = await this.entityManager.findOne(
                LeagueCohortPointsProjectionEntity,
                {
                    where: {
                        cohortId,
                    },
                },
            )
        }
        return row?.value ?? {
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the cohort week-points UPSERT — each member's flat points summed inside
     * the cohort's own `[week_start_at, week_end_at)` window (LEFT JOIN so a
     * zero-point member still appears), ranked best → worst, folded into
     * `value.members` for the single cohort `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO league_cohort_points_projections (cohort_id, value)
            SELECT $1::uuid, jsonb_build_object('members', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId',     m.user_id,
                        'username',   m.username,
                        'avatar',     m.avatar,
                        'weekPoints', m.week_points
                    ) ORDER BY m.week_points DESC, m.user_id ASC
                )
                FROM (
                    SELECT u.id                          AS user_id,
                           u.username                    AS username,
                           u.avatar                      AS avatar,
                           COALESCE(SUM(x.points), 0)::int AS week_points
                    FROM league_cohorts c
                    JOIN user_leagues ul ON ul.cohort_id = c.id
                    JOIN users u ON u.id = ul.user_id
                    LEFT JOIN xp_histories x
                        ON x.user_id = ul.user_id
                       AND x.created_at >= c.week_start_at
                       AND x.created_at < c.week_end_at
                    WHERE c.id = $1
                    GROUP BY u.id, u.username, u.avatar
                ) m
            ), '[]'::jsonb))
            ON CONFLICT (cohort_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
