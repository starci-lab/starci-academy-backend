import {
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AchievementEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserAchievementEntity,
    UserAchievementProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    ACHIEVEMENT_BADGES,
    AbstractBadge,
} from "./badges"
import type {
    AchievementCountRow,
    AchievementHolderCountRow,
    CachedMyAchievementsValue,
    EarnedAchievementEntry,
    InsertedIdRow,
    MyAchievementResult,
    MyAchievementsResult,
    NewlyEarnedAchievement,
    RecomputeAchievementsForUserParams,
} from "./types"

@Injectable()
/**
 * Business service for GitHub-style achievements / badges.
 *
 * Each badge (one animal) is its own {@link AbstractBadge} service owning a scalar
 * SQL subquery; this service **stitches every badge's `getSql()` into ONE composite
 * query** (a single round-trip) to get all metric values, then asks each badge
 * `checkEligible(value, definition)` which tiers were reached. Eligibility bars
 * live on the seeded DB definition (matched by slug).
 *
 * Awards are computed on-read ({@link getMyAchievements}) — returning the full
 * list, the earned count, and the subset newly earned this read.
 */
export class AchievementsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(ACHIEVEMENT_BADGES)
        private readonly badges: Array<AbstractBadge>,
    ) {}

    /**
     * Read the user's achievement wall through its CQRS projection. A fresh row is
     * returned as-is (no recompute, nothing newly earned). On a miss / stale row
     * the wall is recomputed + awarded ({@link computeAndAward}) and cached; the
     * achievement CDC listener invalidates the row whenever a source metric
     * changes, so the next read self-heals.
     *
     * @param userId - the viewer.
     * @returns `{ data, count, newAchievements }` (newAchievements only on recompute).
     */
    async getMyAchievements(userId: string): Promise<MyAchievementsResult> {
        // flat projection read (PK is user_id)
        const row = await this.entityManager.findOne(
            UserAchievementProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // fresh cache hit → return the snapshot, nothing newly earned
        if (row && !this.isStale(row.updatedAt)) {
            const value = row.value as CachedMyAchievementsValue
            return {
                data: this.hydrate(value.data ?? []),
                count: value.count ?? 0,
                newAchievements: [],
            }
        }
        // miss / stale → recompute + award, then cache the snapshot
        const view = await this.computeAndAward(userId)
        await this.entityManager.query(
            this.buildUpsertSql(),
            [
                userId,
                JSON.stringify({
                    data: view.data,
                    count: view.count,
                }),
            ],
        )
        return view
    }

    /**
     * Hard-invalidate one user's achievement projection (CDC delete-on-write), so
     * the next read recomputes + re-awards from the source tables.
     *
     * @param userId - the user whose projection to drop.
     */
    async invalidate(userId: string): Promise<void> {
        await this.entityManager.delete(
            UserAchievementProjectionEntity,
            {
                userId,
            },
        )
    }

    /**
     * Compute the achievement wall from source (composite metric query + award) —
     * the list, the earned count, and the subset newly earned this pass.
     *
     * @param userId - the viewer.
     * @returns `{ data, count, newAchievements }`.
     */
    private async computeAndAward(userId: string): Promise<MyAchievementsResult> {
        // curated definitions (display + eligibility bars), in display order
        const definitions = await this.entityManager.find(
            AchievementEntity,
            {
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        const definitionBySlug = this.indexDefinitions(definitions)
        // ONE composite query for every badge's metric value
        const valueBySlug = await this.computeValues(userId,
            this.entityManager)
        // award-on-read using the values we just computed (no extra query); the rows
        // actually inserted are surfaced as `newAchievements`
        const newlyEarned = await this.award(userId,
            this.entityManager,
            definitionBySlug,
            valueBySlug)
        // earned ledger AFTER awarding so newly-inserted rows count as earned.
        // `userId` is a @RelationId (virtual), so filter via the relation's id.
        const earned = await this.entityManager.find(
            UserAchievementEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        const earnedByAchievementId = this.indexEarned(earned)
        // population rarity per achievement (% of users who hold it) for "Top X%"
        const rarityByAchievementId = await this.computeRarity(this.entityManager)
        // map each definition into the presentation row
        const achievements = definitions.map((definition) => {
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
                currentValue: valueBySlug.get(definition.slug) ?? 0,
                tierReached: earnedEntry?.tier ?? null,
                // rarity only meaningful once earned (else it just leaks the bar)
                rarityPercent: earnedEntry
                    ? rarityByAchievementId.get(definition.id) ?? null
                    : null,
            }
        })
        // the badges whose first award was inserted this read
        const newSlugs = new Set(newlyEarned.map((award) => award.slug))
        const newAchievements = achievements.filter((item) => newSlugs.has(item.slug))
        return {
            data: achievements,
            count: achievements.filter((item) => item.earned).length,
            newAchievements,
        }
    }

    /**
     * Re-evaluate every badge for one user and INSERT an idempotent award row for
     * any threshold (or tier threshold) newly met. Idempotent on the
     * `(user, achievement, tier)` unique key, so `earnedAt` is captured once.
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
        const definitions = await manager.find(AchievementEntity)
        const definitionBySlug = this.indexDefinitions(definitions)
        const valueBySlug = await this.computeValues(userId,
            manager)
        return this.award(userId,
            manager,
            definitionBySlug,
            valueBySlug)
    }

    /**
     * Compute every badge's metric value in ONE composite query: each badge's
     * scalar `getSql()` becomes one column. Returns a `slug → value` map.
     *
     * @param userId - the user to measure.
     * @param manager - the entity manager to run on.
     * @returns the metric value per badge slug.
     */
    private async computeValues(
        userId: string,
        manager: EntityManager,
    ): Promise<Map<string, number>> {
        // nothing registered → nothing to query (avoids an empty `SELECT`)
        if (this.badges.length === 0) {
            return new Map()
        }
        // stitch each badge's scalar subquery into one SELECT, aliased by index
        const columns = this.badges
            .map((badge, index) => `${badge.getSql()} AS v${index}`)
            .join(",\n")
        const rows = await manager.query<Array<Record<string, string | number>>>(
            `SELECT ${columns}`,
            [
                userId,
            ],
        )
        const row = rows[0] ?? {
        }
        // map each aliased column back to its badge slug
        const valueBySlug = new Map<string, number>()
        this.badges.forEach((badge, index) => {
            valueBySlug.set(badge.slug,
                Number(row[`v${index}`]) || 0)
        })
        return valueBySlug
    }

    /**
     * For each badge, ask which tiers its value reached and INSERT the missing
     * awards. Badges without a seeded definition (slug mismatch) are skipped.
     *
     * @param userId - the earner.
     * @param manager - the entity manager to run on.
     * @param definitionBySlug - seeded definitions keyed by slug (bars + id).
     * @param valueBySlug - each badge's current metric value.
     * @returns the awards newly inserted this pass.
     */
    private async award(
        userId: string,
        manager: EntityManager,
        definitionBySlug: Map<string, AchievementEntity>,
        valueBySlug: Map<string, number>,
    ): Promise<Array<NewlyEarnedAchievement>> {
        const newlyEarned: Array<NewlyEarnedAchievement> = []
        for (const badge of this.badges) {
            // the seeded definition carries this badge's bars + row id
            const definition = definitionBySlug.get(badge.slug)
            if (!definition) {
                continue
            }
            const value = valueBySlug.get(badge.slug) ?? 0
            // the badge decides which tiers the value has reached
            for (const tier of badge.checkEligible(value,
                definition)) {
                const inserted = await this.insertAwardIfAbsent(manager,
                    userId,
                    definition.id,
                    tier)
                if (inserted) {
                    newlyEarned.push({
                        slug: badge.slug,
                        tier,
                    })
                }
            }
        }
        return newlyEarned
    }

    /**
     * Index definitions by their slug (the key that pairs a badge service to its
     * seeded definition).
     *
     * @param definitions - the seeded achievement definitions.
     * @returns a map from slug to definition.
     */
    private indexDefinitions(
        definitions: Array<AchievementEntity>,
    ): Map<string, AchievementEntity> {
        return new Map(definitions.map((definition) => [
            definition.slug,
            definition,
        ]))
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
    ): Map<string, EarnedAchievementEntry> {
        const byAchievementId = new Map<string, EarnedAchievementEntry>()
        for (const award of earned) {
            const existing = byAchievementId.get(award.achievementId)
            if (!existing) {
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
     * Population rarity per achievement: the share of users who hold each badge,
     * as a whole percent (clamped to a floor of 1 so a held badge never reads as
     * "Top 0%"). Lower = rarer. Returned keyed by achievement id.
     *
     * @param manager - the entity manager to run on.
     * @returns a map from achievement id to its rarity percent.
     */
    private async computeRarity(
        manager: EntityManager,
    ): Promise<Map<string, number>> {
        const map = new Map<string, number>()
        const totalRows = await manager.query<Array<AchievementCountRow>>(
            "SELECT COUNT(*)::int AS c FROM users",
        )
        const total = Number(totalRows[0]?.c) || 0
        // no users → no meaningful denominator
        if (total === 0) {
            return map
        }
        const rows = await manager.query<Array<AchievementHolderCountRow>>(
            `SELECT achievement_id, COUNT(DISTINCT user_id)::int AS c
             FROM user_achievements
             GROUP BY achievement_id`,
        )
        for (const row of rows) {
            const percent = Math.max(1,
                Math.round((Number(row.c) / total) * 100))
            map.set(row.achievement_id,
                percent)
        }
        return map
    }

    /**
     * Whether a projection row is past its freshness window (the TTL safety net
     * behind CDC invalidation).
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured projection TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Re-hydrate cached achievement rows: jsonb stores `earnedAt` as an ISO string,
     * so coerce it back to a `Date` for the GraphQL layer.
     *
     * @param stored - the cached achievement rows.
     * @returns the rows with `earnedAt` as a Date (or null).
     */
    private hydrate(
        stored: Array<MyAchievementResult>,
    ): Array<MyAchievementResult> {
        return stored.map((item) => ({
            ...item,
            earnedAt: item.earnedAt ? new Date(item.earnedAt) : null,
        }))
    }

    /**
     * Build the projection UPSERT: store `{ data, count }` jsonb for user `$1`,
     * refreshing `updated_at` on conflict so the TTL clock restarts.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_achievement_projections (user_id, value)
            VALUES ($1::uuid, $2::jsonb)
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
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
        const inserted = await manager.query<Array<InsertedIdRow>>(
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
        return inserted.length > 0
    }
}
