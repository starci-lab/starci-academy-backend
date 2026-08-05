import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    UserCodingProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-coding-projection.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    CodingLeaderboardEntryResult,
    CodingLeaderboardRow,
    CodingStandingResult,
    RecomputeUserCodingParams,
    UserCodingHistoryResult,
    UserCodingHistoryValue,
    UserCodingLeaderboardParams,
    UserCodingRankParams,
    UserCodingStandingRow,
    UserCodingSkillCountResult,
    UserCodingSkillsResult,
} from "./types"

/** Default number of leaderboard entries when the caller gives none. */
const DEFAULT_LEADERBOARD_LIMIT = 50

@Injectable()
/**
 * CQRS projection service for a user's coding-practice aggregate. The heavy
 * GROUP BYs over `coding_submissions` run ONLY in {@link recompute}, which folds
 * `{ byLanguage, byDifficulty, history }` into the jsonb `value` keyed by user.
 * {@link getSkills} / {@link getHistory} read the flat row with a TTL lazy-refresh;
 * the CDC listener keeps it fresh on new submissions.
 */
export class UserCodingProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the coding aggregate for one user (idempotent UPSERT).
     *
     * @param params - {@link RecomputeUserCodingParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserCodingParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's solved-coding breakdown (by language + difficulty), TTL
     * lazy-refreshed.
     *
     * @param userId - the user to read.
     * @returns the skills breakdown.
     */
    async getSkills(userId: string): Promise<UserCodingSkillsResult> {
        const value = await this.readValue(userId)
        return {
            byLanguage: (value.byLanguage as Array<UserCodingSkillCountResult> | undefined) ?? [],
            byDifficulty: (value.byDifficulty as Array<UserCodingSkillCountResult> | undefined) ?? [],
            byDomain: (value.byDomain as Array<UserCodingSkillCountResult> | undefined) ?? [],
        }
    }

    /**
     * Read a user's solved coding-problem history (newest first), TTL lazy-refreshed.
     *
     * @param userId - the user to read.
     * @returns the solved problems with the language(s) used.
     */
    async getHistory(userId: string): Promise<Array<UserCodingHistoryResult>> {
        const value = await this.readValue(userId)
        const history = (value.history as Array<UserCodingHistoryValue> | undefined) ?? []
        // map the stored ISO string back to a Date for the GraphQL Date scalar
        return history.map((item) => ({
            problemTitle: item.problemTitle,
            slug: item.slug,
            difficulty: item.difficulty,
            domain: item.domain,
            languages: Array.isArray(item.languages) ? item.languages : [],
            firstSolvedAt: item.firstSolvedAt ? new Date(item.firstSolvedAt) : null,
        }))
    }

    /**
     * Top users by distinct problems solved -- a thin ORDER BY over the per-user
     * projection rows (no GROUP BY per request; the count is already materialised
     * in `value->>'solvedCount'`). Mirrors the course-leaderboard read pattern.
     *
     * @param params - {@link UserCodingLeaderboardParams}
     * @returns ranked entries, highest solved count first.
     */
    async getLeaderboard(
        {
            limit = DEFAULT_LEADERBOARD_LIMIT,
        }: UserCodingLeaderboardParams,
    ): Promise<Array<CodingLeaderboardEntryResult>> {
        const rows = await this.entityManager.query<Array<CodingLeaderboardRow>>(
            `
            SELECT p.user_id                       AS user_id,
                   u.username                      AS username,
                   (p.value->>'solvedCount')::int  AS solved_count
            FROM user_coding_projections p
            JOIN users u ON u.id = p.user_id
            WHERE (p.value->>'solvedCount')::int > 0
            ORDER BY (p.value->>'solvedCount')::int DESC, p.updated_at ASC
            LIMIT $1
            `,
            [
                limit,
            ],
        )
        return rows.map((row) => ({
            userId: row.user_id,
            username: row.username ?? "",
            solvedCount: Number(row.solved_count) || 0,
        }))
    }

    /**
     * Read a user's derived coding standing -- a 1-based global rank + a 0-100
     * percentile by distinct solved problems -- same ordering as
     * {@link getLeaderboard} (solvedCount DESC, tie-break updated_at ASC). A
     * single pass over the per-user projection rows (the count is already
     * materialised in `value->>'solvedCount'`); no aggregation per request.
     * Mirrors `UserSolvedChallengesProjectionService.getChallengeStrength`.
     *
     * @param params - {@link UserCodingRankParams}
     * @returns the {@link CodingStandingResult}; both fields null when the user has 0 solves / no row.
     */
    async getRank(
        {
            userId,
        }: UserCodingRankParams,
    ): Promise<CodingStandingResult> {
        // single pass over the per-user projection rows: my solved count, my rank,
        // how many I beat, and the pool size -- no per-request aggregation over raw submissions.
        const rows = await this.entityManager.query<Array<UserCodingStandingRow>>(
            `
            WITH pool AS (
                SELECT p.user_id AS user_id,
                       (p.value->>'solvedCount')::int AS solved_count,
                       p.updated_at AS updated_at
                FROM user_coding_projections p
                WHERE (p.value->>'solvedCount')::int > 0
            ),
            me AS (
                SELECT COALESCE((
                    SELECT (p.value->>'solvedCount')::int
                    FROM user_coding_projections p
                    WHERE p.user_id = $1::uuid
                ), 0) AS solved_count
            )
            SELECT me.solved_count AS mine,
                   CASE WHEN me.solved_count > 0 THEN (
                       SELECT 1 + COUNT(*)::int
                       FROM pool
                       WHERE pool.solved_count > me.solved_count
                          OR (pool.solved_count = me.solved_count
                              AND pool.updated_at < (
                                  SELECT updated_at FROM pool WHERE pool.user_id = $1::uuid
                              ))
                   ) ELSE NULL END AS rank,
                   (
                       SELECT COUNT(*)::int FROM pool WHERE pool.solved_count < me.solved_count
                   ) AS beaten,
                   (SELECT COUNT(*)::int FROM pool) AS pool_size
            FROM me
            `,
            [
                userId,
            ],
        )
        const row = rows[0]
        const mine = Number(row?.mine) || 0
        // no solves -> unranked (both fields null)
        if (mine <= 0) {
            return {
                rank: null,
                percentile: null,
            }
        }
        const poolSize = Number(row?.pool_size) || 0
        const beaten = Number(row?.beaten) || 0
        const rank = typeof row?.rank === "number" ? row.rank : null
        // percentile = share of the pool this user strictly beats (0 when pool is just me)
        const percentile = poolSize > 0 ? Math.round((beaten / poolSize) * 100) : 0
        return {
            rank,
            percentile,
        }
    }

    /**
     * Read the projection row's jsonb value, recomputing first when missing or
     * stale (TTL lazy-refresh). Shared by {@link getSkills} + {@link getHistory}
     * so a single read refreshes at most once.
     *
     * @param userId - the user to read.
     * @returns the jsonb value (empty object when still absent).
     */
    private async readValue(userId: string): Promise<Record<string, unknown>> {
        let row = await this.entityManager.findOne(
            UserCodingProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window -> recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserCodingProjectionEntity,
                {
                    where: {
                        userId,
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
     * Build the coding-aggregate UPSERT -- solved counts by language + difficulty
     * and the per-problem solved history (with languages used), all distinct over
     * Accepted submissions for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_coding_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                'solvedCount', COALESCE((
                    SELECT COUNT(DISTINCT cs.coding_problem_id)::int
                    FROM coding_submissions cs
                    WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                ), 0),
                'byLanguage', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object('key', l.language, 'solved', l.solved)
                        ORDER BY l.solved DESC
                    )
                    FROM (
                        SELECT cs.language::text AS language,
                               COUNT(DISTINCT cs.coding_problem_id)::int AS solved
                        FROM coding_submissions cs
                        WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                        GROUP BY cs.language
                    ) l
                ), '[]'::jsonb),
                'byDifficulty', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object('key', d.difficulty, 'solved', d.solved)
                    )
                    FROM (
                        SELECT cp.difficulty::text AS difficulty,
                               COUNT(DISTINCT cs.coding_problem_id)::int AS solved
                        FROM coding_submissions cs
                        JOIN coding_problems cp ON cp.id = cs.coding_problem_id
                        WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                        GROUP BY cp.difficulty
                    ) d
                ), '[]'::jsonb),
                'byDomain', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object('key', dm.domain, 'solved', dm.solved)
                        ORDER BY dm.solved DESC
                    )
                    FROM (
                        SELECT cp.domain::text AS domain,
                               COUNT(DISTINCT cs.coding_problem_id)::int AS solved
                        FROM coding_submissions cs
                        JOIN coding_problems cp ON cp.id = cs.coding_problem_id
                        WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                        GROUP BY cp.domain
                    ) dm
                ), '[]'::jsonb),
                'history', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'problemTitle', h.title,
                            'slug',         h.slug,
                            'difficulty',   h.difficulty,
                            'domain',       h.domain,
                            'languages',    h.languages,
                            'firstSolvedAt', h.first_solved_at
                        ) ORDER BY h.first_solved_at DESC
                    )
                    FROM (
                        SELECT cp.id,
                               cp.title,
                               cp.slug,
                               cp.difficulty::text AS difficulty,
                               cp.domain::text AS domain,
                               array_agg(DISTINCT cs.language::text) AS languages,
                               MIN(cs.created_at) AS first_solved_at
                        FROM coding_submissions cs
                        JOIN coding_problems cp ON cp.id = cs.coding_problem_id
                        WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                        GROUP BY cp.id, cp.title, cp.slug, cp.difficulty, cp.domain
                    ) h
                ), '[]'::jsonb)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
