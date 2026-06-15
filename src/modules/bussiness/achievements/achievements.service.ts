import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AchievementCriteriaType,
    AchievementEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserAchievementEntity,
} from "@modules/databases"
import type {
    AchievementCriteriaValues,
    CriteriaValuesRow,
    MyAchievementResult,
    NewlyEarnedAchievement,
    RecomputeAchievementsForUserParams,
} from "./types"

/**
 * Business service for GitHub-style achievements / badges.
 *
 * Reads ({@link getMyAchievements}) join every achievement definition with the
 * viewer's earned ledger + a single per-user criteria-value query, so the
 * profile gets each badge's definition, earned status, and live progress in one
 * pass. Writes ({@link recomputeForUser}) re-evaluate every definition against
 * the same criteria values and INSERT an idempotent award row for any threshold
 * (or tier threshold) newly met — driven inline and by the CDC listener.
 *
 * The criteria-value query reuses the exact join logic the progress projection
 * uses (lessons read / challenges passed / milestones passed) plus the
 * user-stats streak gaps-and-islands, so the numbers always agree across
 * features.
 */
@Injectable()
export class AchievementsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Every achievement definition joined with the viewer's earned status and
     * live progress, ordered for display.
     *
     * @param userId - the viewer.
     * @returns one row per definition (definition fields + earned + currentValue + tierReached).
     */
    async getMyAchievements(userId: string): Promise<Array<MyAchievementResult>> {
        // load the curated definition set in display order
        const definitions = await this.entityManager.find(
            AchievementEntity,
            {
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        // the viewer's earned ledger (any tier) — used to flag earned + earliest date + top tier
        const earned = await this.entityManager.find(
            UserAchievementEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // one round-trip for all five live metric values
        const values = await this.computeCriteriaValues(userId,
            this.entityManager)
        // fold the ledger into per-achievement aggregates (earliest earnedAt, highest tier)
        const earnedByAchievementId = this.indexEarned(earned)
        // map each definition into the presentation row
        return definitions.map((definition) => {
            // the viewer's progress against this definition's metric
            const currentValue = values[definition.criteriaType]
            // earned aggregate for this achievement, if any tier has been recorded
            const earnedEntry = earnedByAchievementId.get(definition.id)
            return {
                slug: definition.slug,
                name: definition.name,
                description: definition.description,
                iconKey: definition.iconKey,
                criteriaType: definition.criteriaType,
                threshold: definition.threshold,
                // earned when at least one award row exists for this achievement
                earned: Boolean(earnedEntry),
                earnedAt: earnedEntry?.earnedAt ?? null,
                currentValue,
                tierReached: earnedEntry?.tier ?? null,
            }
        })
    }

    /**
     * Re-evaluate every achievement definition for one user and INSERT an
     * idempotent award row for any threshold (or tier threshold) newly met.
     * Idempotent on the `(user, achievement, tier)` unique key, so `earnedAt` is
     * captured exactly once.
     *
     * @param params - {@link RecomputeAchievementsForUserParams}
     * @returns the awards newly inserted this pass (so a caller could notify later).
     */
    async recomputeForUser(
        {
            userId,
            entityManager,
        }: RecomputeAchievementsForUserParams,
    ): Promise<Array<NewlyEarnedAchievement>> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // load definitions + the viewer's live metric values together
        const definitions = await manager.find(AchievementEntity)
        const values = await this.computeCriteriaValues(userId,
            manager)
        // accumulate every award row that should exist given the current values
        const newlyEarned: Array<NewlyEarnedAchievement> = []
        for (const definition of definitions) {
            // the viewer's progress against this definition's metric
            const currentValue = values[definition.criteriaType]
            // resolve which tiers (or the single bar) the value has reached
            const reached = this.resolveReachedTiers(definition.tierThresholds,
                definition.threshold,
                currentValue)
            for (const tier of reached) {
                // idempotent award INSERT — ON CONFLICT DO NOTHING on the unique key
                const inserted = await this.insertAwardIfAbsent(manager,
                    userId,
                    definition.id,
                    tier)
                // only surface rows that were actually created this pass
                if (inserted) {
                    newlyEarned.push({
                        slug: definition.slug,
                        tier,
                    })
                }
            }
        }
        return newlyEarned
    }

    /**
     * Compute all five live criteria values for one user in a single query.
     * Reuses the progress-projection join logic (lessons read / challenges
     * passed / milestones passed), the enrollment count, and the user-stats
     * streak gaps-and-islands.
     *
     * @param userId - the user to measure.
     * @param manager - the entity manager to run on (caller's tx or service connection).
     * @returns the metric values keyed by criteria type.
     */
    private async computeCriteriaValues(
        userId: string,
        manager: EntityManager,
    ): Promise<AchievementCriteriaValues> {
        // single round-trip: each metric is an independent scalar subquery on $1
        const rows = await manager.query<Array<CriteriaValuesRow>>(
            `
            SELECT
                -- lessons read: first-read content rows for this user
                COALESCE((
                    SELECT COUNT(*) FROM user_contents
                    WHERE user_id = $1 AND is_read = true
                ), 0) AS lessons_read,
                -- distinct challenges passed: max attempt score per submission, summed
                -- per challenge, counted when it reaches the challenge's pass score
                COALESCE((
                    WITH per_submission_max AS (
                        SELECT cs.challenge_id,
                               cs.id AS submission_id,
                               COALESCE(MAX(a.score), 0) AS max_score
                        FROM user_challenge_submissions ucs
                        JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                        LEFT JOIN user_challenge_submission_attempts a
                            ON a.user_challenge_submission_id = ucs.id
                        WHERE ucs.user_id = $1
                        GROUP BY cs.challenge_id, cs.id
                    ),
                    per_challenge AS (
                        SELECT challenge_id, SUM(max_score) AS challenge_score
                        FROM per_submission_max
                        GROUP BY challenge_id
                    )
                    SELECT COUNT(*) FROM per_challenge pc
                    JOIN challenges c ON c.id = pc.challenge_id
                    WHERE pc.challenge_score >= c.score AND c.score > 0
                ), 0) AS challenges_passed,
                -- milestone tasks passed: distinct passed task attempts via the user's enrollments
                COALESCE((
                    SELECT COUNT(DISTINCT umt.id)
                    FROM enrollments e
                    JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
                    JOIN user_milestone_task_attempts umta
                        ON umta.user_milestone_task_id = umt.id AND umta.passed = true
                    WHERE e.user_id = $1
                ), 0) AS milestones_passed,
                -- courses enrolled: enrollment rows for this user
                COALESCE((
                    SELECT COUNT(*) FROM enrollments WHERE user_id = $1
                ), 0) AS courses_enrolled,
                -- consecutive-day streak ending today/yesterday: gaps-and-islands over
                -- the distinct active days (subtracting the ascending row number from
                -- each day yields a constant island date per consecutive run)
                COALESCE((
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
                ), 0) AS streak_days
            `,
            [
                userId,
            ],
        )
        // the single result row (defaults to zeros for a brand-new user)
        const row = rows[0]
        // normalise the numeric-string columns into a typed, criteria-keyed map
        return {
            [AchievementCriteriaType.LessonsRead]: Number(row?.lessons_read) || 0,
            [AchievementCriteriaType.StreakDays]: Number(row?.streak_days) || 0,
            [AchievementCriteriaType.ChallengesPassed]: Number(row?.challenges_passed) || 0,
            [AchievementCriteriaType.MilestonesPassed]: Number(row?.milestones_passed) || 0,
            [AchievementCriteriaType.CoursesEnrolled]: Number(row?.courses_enrolled) || 0,
        }
    }

    /**
     * Fold a user's award ledger into per-achievement aggregates: the earliest
     * `earnedAt` (first time any tier was earned) and the highest tier reached.
     *
     * @param earned - the viewer's award rows.
     * @returns a map from achievement id to its aggregate earned entry.
     */
    private indexEarned(
        earned: Array<UserAchievementEntity>,
    ): Map<string, { earnedAt: Date, tier: number | null }> {
        // reduce many tier rows per achievement into one aggregate row
        const byAchievementId = new Map<string, { earnedAt: Date, tier: number | null }>()
        for (const award of earned) {
            // the running aggregate for this achievement, if seen before
            const existing = byAchievementId.get(award.achievementId)
            if (!existing) {
                // first row → seed the aggregate
                byAchievementId.set(award.achievementId,
                    {
                        earnedAt: award.earnedAt,
                        tier: award.tier,
                    })
                continue
            }
            // keep the earliest earnedAt (first time the badge was earned)
            if (award.earnedAt < existing.earnedAt) {
                existing.earnedAt = award.earnedAt
            }
            // keep the highest tier reached (null tiers compare as 0)
            if ((award.tier ?? 0) > (existing.tier ?? 0)) {
                existing.tier = award.tier
            }
        }
        return byAchievementId
    }

    /**
     * Resolve which award rows should exist for a definition given a value.
     * A tiered definition yields one entry per tier whose bar is met (1-based);
     * a single-tier definition yields `[null]` when its threshold is met.
     *
     * @param tierThresholds - ascending tier bars, or null for single-tier.
     * @param threshold - the single-tier bar (used when not tiered).
     * @param currentValue - the user's current metric value.
     * @returns the tiers to award (`[]` when none reached).
     */
    private resolveReachedTiers(
        tierThresholds: Array<number> | null,
        threshold: number,
        currentValue: number,
    ): Array<number | null> {
        // single-tier badge → award the null tier once the bar is met
        if (!tierThresholds || tierThresholds.length === 0) {
            return currentValue >= threshold ? [null] : []
        }
        // tiered badge → one 1-based tier per bar the value has reached
        const reached: Array<number | null> = []
        tierThresholds.forEach((bar, index) => {
            // the value cleared this tier's bar → record the 1-based tier number
            if (currentValue >= bar) {
                reached.push(index + 1)
            }
        })
        return reached
    }

    /**
     * Idempotently INSERT one award row, returning whether a row was created.
     *
     * Postgres treats NULLs as distinct in a unique index, so the single-tier
     * (`tier IS NULL`) row would NOT be caught by the `(user, achievement, tier)`
     * constraint. To dedupe both tiered and single-tier awards uniformly we
     * INSERT … SELECT guarded by a `NOT EXISTS` check on the null-safe match
     * (`tier IS NOT DISTINCT FROM $3`); the unique constraint is the backstop
     * against a concurrent racing insert of the same tiered row.
     *
     * @param manager - the entity manager to run on.
     * @param userId - the earner.
     * @param achievementId - the definition earned.
     * @param tier - the tier reached (1-based), or null for single-tier.
     * @returns true when a new row was inserted, false when it already existed.
     */
    private async insertAwardIfAbsent(
        manager: EntityManager,
        userId: string,
        achievementId: string,
        tier: number | null,
    ): Promise<boolean> {
        // INSERT only when no row already matches (null-safe on tier); RETURNING id
        // is empty when the guard suppressed the insert. ON CONFLICT DO NOTHING
        // covers the concurrent-insert race on the tiered unique key.
        const inserted = await manager.query<Array<{ id: string }>>(
            `
            INSERT INTO user_achievements (user_id, achievement_id, tier, earned_at)
            SELECT $1, $2, $3, now()
            WHERE NOT EXISTS (
                SELECT 1 FROM user_achievements
                WHERE user_id = $1
                  AND achievement_id = $2
                  AND tier IS NOT DISTINCT FROM $3
            )
            ON CONFLICT DO NOTHING
            RETURNING id
            `,
            [
                userId,
                achievementId,
                tier,
            ],
        )
        // a returned row means this pass created the award
        return inserted.length > 0
    }
}
