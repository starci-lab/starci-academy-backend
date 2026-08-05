import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserSolvedChallengesProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    ChallengeStrengthResult,
    ChallengeStrengthRow,
    RecomputeUserSolvedChallengesParams,
    UserSolvedChallengeResult,
    UserSolvedChallengeValue,
} from "./types"

@Injectable()
/**
 * CQRS projection service for a user's passed challenge submissions (with their
 * submitted git / docs link). The DISTINCT-ON join over
 * `user_challenge_submission_attempts` runs ONLY in {@link recompute}, folding
 * `{ challenges: [...] }` (newest-first) into the jsonb `value` keyed by user.
 * {@link getChallenges} reads the flat row with a TTL lazy-refresh; the CDC
 * listener keeps it fresh on new passing attempts.
 */
export class UserSolvedChallengesProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the solved-challenges aggregate for one user (idempotent).
     *
     * @param params - {@link RecomputeUserSolvedChallengesParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserSolvedChallengesParams,
    ): Promise<void> {
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's passed challenge submissions (newest first), TTL lazy-refreshed.
     *
     * @param userId - the user to read.
     * @returns the passed challenge submissions with their links.
     */
    async getChallenges(userId: string): Promise<Array<UserSolvedChallengeResult>> {
        let row = await this.entityManager.findOne(
            UserSolvedChallengesProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserSolvedChallengesProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        const challenges = (row?.value?.challenges as Array<UserSolvedChallengeValue> | undefined) ?? []
        // map the stored ISO string back to a Date (already newest-first in jsonb)
        return challenges.map((challenge) => ({
            id: challenge.id ?? null,
            title: challenge.title,
            submissionUrl: challenge.submissionUrl,
            submissionType: challenge.submissionType,
            selectedLang: challenge.selectedLang ?? null,
            difficulty: challenge.difficulty ?? null,
            score: challenge.score ?? null,
            courseId: challenge.courseId ?? null,
            courseTitle: challenge.courseTitle ?? null,
            courseSlug: challenge.courseSlug ?? null,
            passedAt: challenge.passedAt ? new Date(challenge.passedAt) : null,
        }))
    }

    /**
     * Read a user's DERIVED challenge-strength percentile + 1-based global rank —
     * a weighted SUM by difficulty (easy 10 / medium 20 / hard 30 / insane 40 /
     * expert 50) over their distinct passes, materialised in
     * `value->>'strengthScore'`. Purely derived — it does NOT touch the points / XP
     * / league economy. The pool is all rows with strengthScore > 0; ordering
     * mirrors the coding rank (strengthScore DESC, tie-break updated_at ASC).
     *
     * @param userId - the user whose challenge strength to compute.
     * @returns the percentile + rank, both null when the user has no passes (unranked).
     */
    async getChallengeStrength(userId: string): Promise<ChallengeStrengthResult> {
        // single pass over the per-user projection rows: my score, my rank, how many
        // I beat, and the pool size — no per-request aggregation over raw submissions.
        const rows = await this.entityManager.query<Array<ChallengeStrengthRow>>(
            `
            WITH pool AS (
                SELECT p.user_id AS user_id,
                       (p.value->>'strengthScore')::int AS strength_score,
                       p.updated_at AS updated_at
                FROM user_solved_challenges_projections p
                WHERE (p.value->>'strengthScore')::int > 0
            ),
            me AS (
                SELECT COALESCE((
                    SELECT (p.value->>'strengthScore')::int
                    FROM user_solved_challenges_projections p
                    WHERE p.user_id = $1::uuid
                ), 0) AS strength_score
            )
            SELECT me.strength_score AS mine,
                   CASE WHEN me.strength_score > 0 THEN (
                       SELECT 1 + COUNT(*)::int
                       FROM pool
                       WHERE pool.strength_score > me.strength_score
                          OR (pool.strength_score = me.strength_score
                              AND pool.updated_at < (
                                  SELECT updated_at FROM pool WHERE pool.user_id = $1::uuid
                              ))
                   ) ELSE NULL END AS rank,
                   (
                       SELECT COUNT(*)::int FROM pool WHERE pool.strength_score < me.strength_score
                   ) AS beaten,
                   (SELECT COUNT(*)::int FROM pool) AS pool_size,
                   (
                       SELECT COALESCE(SUM(xh.amount), 0)::int
                       FROM xp_histories xh
                       WHERE xh.user_id = $1::uuid AND xh.source = 'challenge'
                   ) AS xp
            FROM me
            `,
            [
                userId,
            ],
        )
        const row = rows[0]
        const mine = Number(row?.mine) || 0
        // real challenge XP from the ledger (sum of amounts), independent of rank
        const xp = Number(row?.xp) || 0
        // no passes → unranked (mirrors the coding rank null contract); XP still reported
        if (mine <= 0) {
            return {
                percentile: null,
                rank: null,
                xp,
            }
        }
        const poolSize = Number(row?.pool_size) || 0
        const beaten = Number(row?.beaten) || 0
        const rank = typeof row?.rank === "number" ? row.rank : null
        // percentile = share of the pool this user strictly beats (0 when pool is just me)
        const percentile = poolSize > 0 ? Math.round((beaten / poolSize) * 100) : 0
        return {
            percentile,
            rank,
            xp,
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
     * Build the solved-challenges UPSERT — one row per passed submission (latest
     * passing attempt: score > 0 + graded, via DISTINCT ON), folded newest-first
     * into `value.challenges` for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        // `t` (the DISTINCT-ON-per-submission passing-attempt set) drives BOTH the
        // newest-first challenges array AND the derived strengthScore (a weighted
        // SUM by difficulty over the SAME passes). strengthScore is purely derived —
        // it does NOT touch the points / XP / league economy.
        return `
            INSERT INTO user_solved_challenges_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                'challenges', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id',             t.id,
                            'title',          t.title,
                            'submissionUrl',  t.submission_url,
                            'submissionType', t.submission_type,
                            'selectedLang',   t.selected_lang,
                            'difficulty',     t.difficulty,
                            'score',          t.score,
                            'courseId',       t.course_id,
                            'courseTitle',    t.course_title,
                            'courseSlug',     t.course_slug,
                            'passedAt',       t.passed_at
                        ) ORDER BY t.passed_at DESC NULLS LAST
                    )
                    FROM (${this.buildPassedAttemptsSubquery()}) t
                ), '[]'::jsonb),
                'strengthScore', COALESCE((
                    SELECT SUM(
                        CASE t.difficulty
                            WHEN 'easy'   THEN 10
                            WHEN 'medium' THEN 20
                            WHEN 'hard'   THEN 30
                            WHEN 'insane' THEN 40
                            WHEN 'expert' THEN 50
                            ELSE 0
                        END
                    )::int
                    FROM (${this.buildPassedAttemptsSubquery()}) t
                ), 0)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }

    /**
     * The DISTINCT-ON-per-submission passing-attempt set (score > 0 + graded,
     * latest attempt per submission) for the single user `$1`. Shared by both the
     * `challenges` array and the derived `strengthScore` SUM so they stay over the
     * identical passing set.
     *
     * @returns the inner SELECT (no outer aggregation), referencing param `$1`.
     */
    private buildPassedAttemptsSubquery(): string {
        return `
            SELECT DISTINCT ON (ucs.id)
                   ucs.id            AS id,
                   COALESCE(ch.title, cs.title) AS title,
                   ucs.submission_url AS submission_url,
                   cs.type::text     AS submission_type,
                   ucs.selected_lang AS selected_lang,
                   ch.difficulty::text AS difficulty,
                   ucsa.score        AS score,
                   crs.id            AS course_id,
                   crs.title         AS course_title,
                   crs.slug          AS course_slug,
                   ucsa.processed_at AS passed_at
            FROM user_challenge_submissions ucs
            JOIN challenge_submissions cs ON cs.id = ucs.submission_id
            LEFT JOIN challenges ch ON ch.id = cs.challenge_id
            LEFT JOIN contents cnt ON cnt.id = ch.content_id
            LEFT JOIN modules m ON m.id = cnt.module_id
            LEFT JOIN courses crs ON crs.id = m.course_id
            JOIN user_challenge_submission_attempts ucsa ON ucsa.user_challenge_submission_id = ucs.id
            WHERE ucs.user_id = $1
              AND ucsa.score > 0
              AND ucsa.processed_at IS NOT NULL
            ORDER BY ucs.id, ucsa.processed_at DESC
        `
    }
}
