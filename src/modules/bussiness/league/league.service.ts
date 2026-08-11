import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    LeagueCohortEntity,
} from "@modules/databases/postgresql/primary/entities/league-cohort.entity"
import {
    UserLeagueEntity,
} from "@modules/databases/postgresql/primary/entities/user-league.entity"
import {
    LeagueTier,
} from "@modules/databases/postgresql/primary/enums/league-tier"
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
    LeagueCohortPointsProjectionService,
} from "../projections/league-cohort-points/league-cohort-points-projection.service"
import {
    LEAGUE_TIER_ORDER,
} from "./constants"
import type {
    ActiveUserBucketRow,
    CohortMemberPointsRow,
    FindOrCreateOpenCohortParams,
    FormNewCohortsParams,
    GlobalLeaderboardResult,
    GlobalLeaderboardRow,
    LeagueCohortIdRow,
    MemberLastWeekRankRow,
    MyStandingResult,
    SettleEndingCohortsParams,
    ShiftTierParams,
} from "./types"

@Injectable()
/**
 * Business logic for the Duolingo-style GLOBAL weekly league.
 *
 * Ranks users by their flat reward points (`xp_histories.points`, course-agnostic)
 * summed inside a fixed Sunday->Sunday (Asia/Ho_Chi_Minh) week window, within a
 * fixed-size cohort (30). {@link getMyStanding} reads a viewer's cohort board
 * (lazily placing them in Bronze + the open cohort on first sight); the weekly
 * cron calls {@link runWeeklyReset} to promote the top 10 / demote the bottom 5
 * and re-bucket everyone into fresh cohorts for the new week.
 */
export class LeagueService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly advisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly leagueCohortPointsProjectionService: LeagueCohortPointsProjectionService,
    ) {}

    /**
     * Read the viewer's current league standing: their tier, their cohort's
     * ranked members, the promote/demote zone sizes, and the week deadline.
     * Lazily places a never-seen user into Bronze + the current open cohort.
     *
     * @param userId - the viewer's user id.
     * @returns the viewer's {@link MyStandingResult}.
     */
    async getMyStanding(userId: string): Promise<MyStandingResult> {
        // read env zone sizes once (used in both the result + the lazy fallback)
        const { promoteCount, demoteCount } = envConfig().league
        // load the viewer's single league row (PK is user_id)
        let userLeague = await this.entityManager.findOne(
            UserLeagueEntity,
            {
                where: {
                    userId,
                },
                // need the cohort window for ranking + the deadline
                relations: {
                    cohort: true,
                },
            },
        )
        // first time we see this user (or their cohort got cleared) -> lazily place
        // them into Bronze + the current open cohort so the board is never empty
        if (!userLeague || !userLeague.cohort) {
            userLeague = await this.placeUserLazily(userId)
        }
        // a cohort is guaranteed by placeUserLazily; capture its window
        const cohort = userLeague.cohort as LeagueCohortEntity
        // ranked members read from the CQRS cohort-points projection (the heavy
        // SUM GROUP BY runs in the projection's recompute, not inline per request)
        const members = await this.leagueCohortPointsProjectionService.getMembers(cohort.id)
        // last-week finishing rank per member (snapshotted at the previous reset)
        // -> the rank-movement caret. A flat read on the per-user league rows.
        const lastWeekRankRows = await this.entityManager.query(
            "SELECT user_id, last_week_rank FROM user_leagues WHERE cohort_id = $1",
            [
                cohort.id,
            ],
        ) as Array<MemberLastWeekRankRow>
        // index last-week rank by user id for an O(1) lookup while mapping
        const lastWeekRankByUser = new Map<string, number | null>(
            lastWeekRankRows.map((row) => [
                row.user_id,
                row.last_week_rank,
            ]),
        )
        // attach each member's movement: positive = climbed N places vs last week,
        // null when they have no baseline (new / inactive last week)
        const rankedMembers = members.map((member) => {
            const lastWeekRank = lastWeekRankByUser.get(member.userId) ?? null
            return {
                ...member,
                rankDelta: lastWeekRank !== null ? lastWeekRank - member.rank : null,
            }
        })
        // assemble the viewer-facing standing
        return {
            tier: userLeague.tier,
            members: rankedMembers,
            promoteCount,
            demoteCount,
            weekEndAt: cohort.weekEndAt,
        }
    }

    /**
     * Read the global (all-users) leaderboard ranked by spendable Coin:
     * the top `limit` users plus the viewer's own rank + points (so the UI can
     * append a "you" row when they sit outside the visible top). Sorts on the
     * already-materialized `users.coin_balance` balance -- no per-request recompute.
     *
     * @param userId - the viewer's user id (for their own rank).
     * @param limit - how many top users to return.
     * @returns the viewer's {@link GlobalLeaderboardResult}.
     */
    async getGlobalLeaderboard(
        userId: string,
        limit: number,
    ): Promise<GlobalLeaderboardResult> {
        // top N users by spendable Coin (tie-broken by id for a stable order)
        const topRows = await this.entityManager.query(
            `
            SELECT id, username, avatar, coin_balance AS points
            FROM users
            ORDER BY coin_balance DESC, id ASC
            LIMIT $1
            `,
            [
                limit,
            ],
        ) as Array<GlobalLeaderboardRow>
        // map to the ranked wire shape (1-based rank = list position)
        const entries = topRows.map((row, index) => ({
            userId: row.id,
            username: row.username,
            avatar: row.avatar,
            points: Number(row.points) || 0,
            rank: index + 1,
        }))
        // the viewer's own Coin balance + rank (count of users strictly ahead, + 1)
        const myRankRows = await this.entityManager.query(
            `
            SELECT
                u.coin_balance AS my_points,
                (SELECT COUNT(*) FROM users o WHERE o.coin_balance > u.coin_balance)::int + 1 AS my_rank
            FROM users u
            WHERE u.id = $1
            `,
            [
                userId,
            ],
        ) as Array<{ my_points: string | number, my_rank: number }>
        // a viewer always has a user row, but guard defensively
        const mine = myRankRows[0]
        return {
            entries,
            myRank: mine ? Number(mine.my_rank) : entries.length + 1,
            myPoints: mine ? Number(mine.my_points) || 0 : 0,
        }
    }

    /**
     * Run the weekly reset (idempotent on the new week's start):
     *  (a) close every cohort whose window just ended -- rank members by week
     *      points, promote the top N / demote the bottom N, write each member's
     *      new tier onto their {@link UserLeagueEntity};
     *  (b) form fresh cohorts for the NEW week -- bucket all active users by their
     *      (post promote/demote) tier, deterministically shuffle, chunk into
     *      groups of the configured size, and reassign each user's cohort.
     *
     * Safe to re-run: cohort creation is guarded by the new week's `weekStartAt`,
     * so a second run within the same week reuses the existing cohorts.
     */
    async runWeeklyReset(): Promise<void> {
        // compute the week boundaries: the week that just ended + the new one
        const newWeekStart = this.currentWeekStart()
        const previousWeekStart = this.addDays(newWeekStart,
            -7)
        // run the whole reset in one transaction so a partial promote/demote can
        // never leave half the league on the old tiers
        await this.entityManager.transaction(async (manager) => {
            // Every application replica registers this cron. Serialize the
            // weekly settlement in PostgreSQL so two ticks cannot both pass
            // the "new cohort does not exist" guard and create duplicates.
            await this.advisoryLockService.acquireXactLockByKey(
                manager,
                `scheduler:league-weekly-reset:${newWeekStart.toISOString()}`,
            )
            // (a) settle the week that just ended: promote/demote every member
            await this.settleEndingCohorts({
                manager,
                previousWeekStart,
                endingWeekStart: previousWeekStart,
            })
            // (b) form the new week's cohorts from the post-settlement tiers,
            // guarded by newWeekStart so re-runs are no-ops
            await this.formNewCohorts({
                manager,
                newWeekStart,
                previousWeekStart,
            })
        })
    }

    /**
     * Place a user that has no current cohort into Bronze + the current open
     * cohort, creating that cohort when none has room (or none exists yet).
     *
     * @param userId - the user to place.
     * @returns the (re)loaded {@link UserLeagueEntity} with its cohort attached.
     */
    private async placeUserLazily(userId: string): Promise<UserLeagueEntity> {
        // do the place inside a transaction so two concurrent first-reads of the
        // same user can't create two rows / over-fill a cohort
        return this.entityManager.transaction(async (manager) => {
            // the current open week window every lazy placement targets
            const weekStartAt = this.currentWeekStart()
            const weekEndAt = this.addDays(weekStartAt,
                7)
            // re-read the row inside the txn (another request may have placed it)
            const existing = await manager.findOne(
                UserLeagueEntity,
                {
                    where: {
                        userId,
                    },
                    relations: {
                        cohort: true,
                    },
                },
            )
            // already placed into a live cohort by a racing request -> reuse it
            if (existing?.cohort) {
                return existing
            }
            // the tier a lazily-placed user lands on: keep their existing tier if
            // they already had a row, else start everyone at Bronze
            const tier = existing?.tier ?? LeagueTier.Bronze
            // find a Bronze/tier cohort for this week that still has room, else make one
            const cohort = await this.findOrCreateOpenCohort({
                manager,
                tier,
                weekStartAt,
                weekEndAt,
            })
            // upsert the user's league row pointing at that cohort
            await manager.save(
                UserLeagueEntity,
                {
                    userId,
                    tier,
                    cohort,
                    joinedWeekAt: weekStartAt,
                },
            )
            // re-read with the relation so callers get a fully-populated row
            return manager.findOneOrFail(
                UserLeagueEntity,
                {
                    where: {
                        userId,
                    },
                    relations: {
                        cohort: true,
                    },
                },
            )
        })
    }

    /**
     * Find a cohort for `tier` in the given week that still has room (< cohort
     * size members), or create a new empty one when all are full / none exist.
     *
     * @param params - manager + target tier + week window.
     * @returns an open {@link LeagueCohortEntity} with capacity for one more user.
     */
    private async findOrCreateOpenCohort(
        {
            manager,
            tier,
            weekStartAt,
            weekEndAt,
        }: FindOrCreateOpenCohortParams,
    ): Promise<LeagueCohortEntity> {
        // configured max members per cohort
        const { cohortSize } = envConfig().league
        // pick the first cohort for this tier+week whose membership is below the cap;
        // a correlated COUNT against user_leagues gives current occupancy
        const openCohortRows = await manager.query(
            `
            SELECT c.id
            FROM league_cohorts c
            WHERE c.tier = $1 AND c.week_start_at = $2
              AND (
                SELECT COUNT(*) FROM user_leagues u WHERE u.cohort_id = c.id
              ) < $3
            ORDER BY c.created_at ASC
            LIMIT 1
            `,
            [
                tier,
                weekStartAt,
                cohortSize,
            ],
        ) as Array<LeagueCohortIdRow>
        // reuse the open cohort when one exists
        if (openCohortRows.length > 0) {
            return manager.findOneOrFail(
                LeagueCohortEntity,
                {
                    where: {
                        id: openCohortRows[0].id,
                    },
                },
            )
        }
        // otherwise create a fresh empty cohort for this tier+week
        return manager.save(
            LeagueCohortEntity,
            {
                tier,
                weekStartAt,
                weekEndAt,
            },
        )
    }

    /**
     * Settle every cohort of the just-ended week: rank its members and write each
     * one's promoted/demoted tier onto their {@link UserLeagueEntity}.
     *
     * @param params - txn manager + the ending week's start.
     */
    private async settleEndingCohorts(
        {
            manager,
            endingWeekStart,
        }: SettleEndingCohortsParams,
    ): Promise<void> {
        // promote/demote zone sizes
        const { promoteCount, demoteCount } = envConfig().league
        // load every cohort whose window started in the ending week
        const cohorts = await manager.find(
            LeagueCohortEntity,
            {
                where: {
                    weekStartAt: endingWeekStart,
                },
            },
        )
        // settle each cohort independently (ranking is per-cohort)
        for (const cohort of cohorts) {
            // rank this cohort's members by points within its own window
            const rows = await manager.query(
                this.buildCohortPointsSql(),
                [
                    cohort.id,
                    cohort.weekStartAt,
                    cohort.weekEndAt,
                ],
            ) as Array<CohortMemberPointsRow>
            // total members decides whether the demotion zone can overlap promotion
            const memberCount = rows.length
            // apply the tier move per member based on their finishing rank
            for (let index = 0; index < memberCount; index++) {
                // 1-based finishing rank (rows are pre-ordered best -> worst)
                const rank = index + 1
                // promotion: top `promoteCount` go up one tier
                const isPromoted = rank <= promoteCount
                // demotion: bottom `demoteCount` go down one tier (guard against the
                // zones overlapping in a tiny cohort -- promotion wins)
                const isDemoted = !isPromoted && rank > memberCount - demoteCount
                // resolve the next tier from the move (clamped at the ends)
                const nextTier = this.shiftTier({
                    tier: cohort.tier,
                    promote: isPromoted,
                    demote: isDemoted,
                })
                // write the new tier onto the member's league row (cohort cleared so
                // the new-week bucketing reassigns it) + snapshot this week's
                // finishing rank so next week's board can show the movement caret
                await manager.update(
                    UserLeagueEntity,
                    {
                        userId: rows[index].user_id,
                    },
                    {
                        tier: nextTier,
                        cohort: null,
                        lastWeekRank: rank,
                    },
                )
            }
        }
    }

    /**
     * Form the new week's cohorts from post-settlement tiers: bucket all active
     * users by tier, deterministically shuffle, chunk into groups of the
     * configured size, insert a cohort per chunk, and point each member at it.
     *
     * @param params - txn manager + the new + previous week starts.
     */
    private async formNewCohorts(
        {
            manager,
            newWeekStart,
            previousWeekStart,
        }: FormNewCohortsParams,
    ): Promise<void> {
        // idempotency guard: if cohorts already exist for the new week, a prior run
        // already formed them -> nothing to do (re-run safe)
        const existingNewCohorts = await manager.count(
            LeagueCohortEntity,
            {
                where: {
                    weekStartAt: newWeekStart,
                },
            },
        )
        if (existingNewCohorts > 0) {
            return
        }
        // the new week's exclusive end (one week after its start)
        const newWeekEnd = this.addDays(newWeekStart,
            7)
        // collect every "active" user that needs a cohort for the new week:
        // anyone who earned >= 1 point in the just-ended week, plus everyone who
        // already has a league row. The deterministic shuffle key md5(user_id ||
        // weekStart) replaces Math.random so re-runs (and tests) are stable.
        const bucketRows = await manager.query(
            this.buildActiveUsersSql(),
            [
                previousWeekStart,
                this.addDays(previousWeekStart,
                    7),
                newWeekStart.toISOString(),
            ],
        ) as Array<ActiveUserBucketRow>
        // group the ordered users by their target tier (order is already the
        // deterministic shuffle, so chunks stay stable)
        const usersByTier = new Map<LeagueTier, Array<string>>()
        for (const bucketRow of bucketRows) {
            // lazily init the per-tier list
            const tierUsers = usersByTier.get(bucketRow.tier) ?? []
            tierUsers.push(bucketRow.user_id)
            usersByTier.set(bucketRow.tier,
                tierUsers)
        }
        // configured cohort capacity
        const { cohortSize } = envConfig().league
        // for each tier, chunk its (shuffled) users into cohorts of cohortSize
        for (const [
            tier,
            tierUsers,
        ] of usersByTier) {
            // walk the user list in fixed-size windows
            for (let offset = 0; offset < tierUsers.length; offset += cohortSize) {
                // the user ids that make up this one cohort
                const chunk = tierUsers.slice(offset,
                    offset + cohortSize)
                // create the cohort row for the new week + tier
                const cohort = await manager.save(
                    LeagueCohortEntity,
                    {
                        tier,
                        weekStartAt: newWeekStart,
                        weekEndAt: newWeekEnd,
                    },
                )
                // point every chunk member at the new cohort + stamp the join week
                await manager.update(
                    UserLeagueEntity,
                    {
                        userId: chunk,
                    },
                    {
                        cohort,
                        joinedWeekAt: newWeekStart,
                    },
                )
            }
        }
    }

    /**
     * Shift a tier up (promote), down (demote), or keep it, clamped so Bronze
     * never demotes below itself and Legend never promotes past itself.
     *
     * @param params - the current tier + which move applies.
     * @returns the resulting tier.
     */
    private shiftTier(
        {
            tier,
            promote,
            demote,
        }: ShiftTierParams,
    ): LeagueTier {
        // current ladder position (index into the ascending tier order)
        const index = LEAGUE_TIER_ORDER.indexOf(tier)
        // promotion moves up one rung, clamped at the top (Legend)
        if (promote) {
            return LEAGUE_TIER_ORDER[Math.min(index + 1,
                LEAGUE_TIER_ORDER.length - 1)]
        }
        // demotion moves down one rung, clamped at the bottom (Bronze)
        if (demote) {
            return LEAGUE_TIER_ORDER[Math.max(index - 1,
                0)]
        }
        // mid-table members stay put
        return tier
    }

    /**
     * Start of the current week -- the most recent Sunday 00:00 in
     * Asia/Ho_Chi_Minh, returned as the equivalent UTC instant.
     *
     * @returns the week-start {@link Date}.
     */
    private currentWeekStart(): Date {
        // Ho_Chi_Minh is a fixed UTC+7 offset (no DST), so we can shift, floor to
        // the local Sunday midnight, then shift back to UTC without a tz library
        const offsetMs = 7 * 60 * 60 * 1000
        // "now" expressed as a local (UTC+7) wall-clock instant
        const local = new Date(Date.now() + offsetMs)
        // days since the most recent Sunday (getUTCDay on the shifted clock = local day)
        const daysSinceSunday = local.getUTCDay()
        // floor the local clock to Sunday 00:00:00.000
        const localWeekStart = Date.UTC(
            local.getUTCFullYear(),
            local.getUTCMonth(),
            local.getUTCDate() - daysSinceSunday,
        )
        // convert that local midnight back to the real UTC instant
        return new Date(localWeekStart - offsetMs)
    }

    /**
     * Add (or subtract) whole days to a date without mutating the input.
     *
     * @param date - the base date.
     * @param days - days to add (negative to subtract).
     * @returns a new shifted {@link Date}.
     */
    private addDays(date: Date, days: number): Date {
        // 86_400_000 ms per day; new Date keeps the original immutable
        return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    }

    /**
     * Build the cohort week-points aggregate SQL (params: `$1` cohort id, `$2`
     * window start, `$3` window end). LEFT JOINs xp_histories so zero-point
     * members still rank; ordered best -> worst, tie-broken by user id.
     *
     * @returns the parameterised SELECT.
     */
    private buildCohortPointsSql(): string {
        return `
            SELECT
                u.id AS user_id,
                u.username AS username,
                u.avatar AS avatar,
                COALESCE(SUM(x.points), 0) AS week_points
            FROM user_leagues ul
            INNER JOIN users u ON u.id = ul.user_id
            LEFT JOIN xp_histories x
                ON x.user_id = ul.user_id
               AND x.created_at >= $2
               AND x.created_at < $3
            WHERE ul.cohort_id = $1
            GROUP BY u.id, u.username, u.avatar
            ORDER BY week_points DESC, u.id ASC
        `
    }

    /**
     * Build the active-users bucketing SQL (params: `$1` ending-week start, `$2`
     * ending-week end, `$3` new-week start used as the deterministic shuffle
     * salt). Returns every league member with >= 1 point in the ending week,
     * with their current tier, ordered by `md5(user_id || $3)` so the shuffle
     * is stable across re-runs (no Math.random). Having a league row alone is
     * NOT enough -- a member who earned nothing in the ending week is pruned
     * from this pass: they keep their tier and current row, but are left
     * without a cohort (`cohort: null`, set by {@link settleEndingCohorts}) and
     * simply do not get a fresh one this week, freeing their cohort slot for an
     * active user. They re-enter a live cohort automatically via
     * {@link placeUserLazily} the next time they're actually active.
     *
     * @returns the parameterised SELECT.
     */
    private buildActiveUsersSql(): string {
        return `
            SELECT
                ul.user_id AS user_id,
                ul.tier AS tier
            FROM user_leagues ul
            WHERE EXISTS (
                SELECT 1 FROM xp_histories x
                WHERE x.user_id = ul.user_id
                  AND x.created_at >= $1
                  AND x.created_at < $2
            )
            ORDER BY md5(ul.user_id::text || $3) ASC
        `
    }
}
