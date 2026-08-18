import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    UserFlashcardStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-stats-projection.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    FlashcardDailyActivityPoint,
    FlashcardGradeDistribution,
    FlashcardStreaks,
    PersistedUserFlashcardStatsValue,
    RecomputeUserFlashcardStatsParams,
    ReviewHistoryRow,
    ReviewMetaRow,
    UserFlashcardDailyActivityParams,
    UserFlashcardStatsParams,
    UserFlashcardStatsResult,
} from "./types"

/** SM-2 grade at/above which a review counts as "recalled" for retention. */
const RECALLED_GRADE = 2

/** A zeroed grade distribution -- the fallback for a row without this key (old row / no history). */
const EMPTY_GRADE_DISTRIBUTION: FlashcardGradeDistribution = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
}

/** Milliseconds in one day (for epoch-day math on `YYYY-MM-DD` strings). */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * How many trailing VN-days of per-day counts to RETAIN in the projection value.
 * Generous headroom over any chart window (currently 14) so the read-time slice
 * is always fully covered; bounds the stored map so it can't grow unbounded over
 * a heavy reviewer's history.
 */
const DAILY_COUNTS_RETAIN_DAYS = 90

@Injectable()
/**
 * CQRS projection service for a user's flashcard study stats. The history scan
 * over `flashcard_review_events` runs ONLY in {@link recompute}, which folds
 * `{ currentStreak, longestStreak, retentionRate, totalReviewed, lastReviewedAt }`
 * into the jsonb `value` keyed by user. {@link getStats} reads the flat row with a
 * TTL lazy-refresh; the CDC listener keeps it fresh on new review events.
 */
export class UserFlashcardStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the flashcard-stats aggregate for one user (idempotent).
     *
     * @param params - {@link RecomputeUserFlashcardStatsParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserFlashcardStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager

        // one row per graded review (its VN day + grade) -- the history to fold
        const history = await manager.query<Array<ReviewHistoryRow>>(
            `SELECT (reviewed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day,
                    grade
             FROM flashcard_review_events
             WHERE user_id = $1`,
            [
                userId,
            ],
        )
        // today (VN) + the latest review timestamp (single-row aggregate)
        const [meta] = await manager.query<Array<ReviewMetaRow>>(
            `SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS today,
                    MAX(reviewed_at)::text AS last_reviewed_at
             FROM flashcard_review_events
             WHERE user_id = $1`,
            [
                userId,
            ],
        )

        const value = this.foldStats(history,
            meta)
        await manager.query(
            `INSERT INTO user_flashcard_stats_projections (user_id, value)
             VALUES ($1::uuid, $2::jsonb)
             ON CONFLICT (user_id) DO UPDATE SET
                 value      = EXCLUDED.value,
                 updated_at = now()`,
            [
                userId,
                JSON.stringify(value),
            ],
        )
    }

    /**
     * Read a user's flashcard stats, TTL lazy-refreshed.
     *
     * @param params - {@link UserFlashcardStatsParams}
     * @returns the stats (zeroed when the user has no history / row).
     */
    async getStats(
        {
            userId,
        }: UserFlashcardStatsParams,
    ): Promise<UserFlashcardStatsResult> {
        const value = await this.readValue(userId)
        const lastReviewedAt = value.lastReviewedAt
        const gradeDistribution = value.gradeDistribution
        return {
            currentStreak: this.numberAt(value,
                "currentStreak"),
            longestStreak: this.numberAt(value,
                "longestStreak"),
            retentionRate: this.numberAt(value,
                "retentionRate"),
            totalReviewed: this.numberAt(value,
                "totalReviewed"),
            lastReviewedAt: typeof lastReviewedAt === "string" ? lastReviewedAt : null,
            gradeDistribution: (gradeDistribution && typeof gradeDistribution === "object")
                ? gradeDistribution as FlashcardGradeDistribution
                : EMPTY_GRADE_DISTRIBUTION,
        }
    }

    /**
     * Read a user's trailing daily-review-activity window (cards graded per VN
     * day), TTL lazy-refreshed off the SAME projection row. The window is built
     * at READ time (today's VN day back `days-1`) and zero-filled from the
     * stored `dailyReviewCounts` map -- so it never drifts even if the row was
     * last recomputed days ago (within TTL).
     *
     * @param params - {@link UserFlashcardDailyActivityParams}
     * @returns `days` day-buckets, oldest first, each `{ date, cardsReviewed }`.
     */
    async getDailyActivity(
        {
            userId,
            days,
        }: UserFlashcardDailyActivityParams,
    ): Promise<Array<FlashcardDailyActivityPoint>> {
        const value = await this.readValue(userId)
        const raw = value.dailyReviewCounts
        // tolerate an old row written before this key existed (-> all zeros)
        const counts = (raw && typeof raw === "object")
            ? raw as Record<string, number>
            : {
            }

        // anchor today's VN day at a UTC midnight so day-stepping is a plain
        // 86.4M-ms subtraction (no DST in VN); enumerate oldest -> newest.
        const [year,
            month,
            day] = this.vnTodayKey().split("-").map(Number)
        const anchor = Date.UTC(year,
            month - 1,
            day)
        const window: Array<FlashcardDailyActivityPoint> = []
        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const date = new Date(anchor - offset * MS_PER_DAY).toISOString().slice(0,
                10)
            const cardsReviewed = Number(counts[date])
            window.push({
                date,
                cardsReviewed: Number.isFinite(cardsReviewed) ? cardsReviewed : 0,
            })
        }
        return window
    }

    /** Today's VN-calendar day as `YYYY-MM-DD` (read-time window anchor). */
    private vnTodayKey(): string {
        return new Intl.DateTimeFormat("en-CA",
            {
                timeZone: "Asia/Ho_Chi_Minh",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(new Date())
    }

    /**
     * Fold the raw review history into the stats payload (streaks in VN days,
     * retention as recalled / total, plus totals).
     *
     * @param history - one row per graded review (VN day + grade).
     * @param meta - today (VN) + the latest review timestamp.
     * @returns the jsonb value to persist.
     */
    private foldStats(
        history: Array<ReviewHistoryRow>,
        meta: ReviewMetaRow | undefined,
    ): PersistedUserFlashcardStatsValue {
        const totalReviewed = history.length
        const recalled = history.filter((row) => row.grade >= RECALLED_GRADE).length
        const retentionRate = totalReviewed > 0
            ? Math.round((recalled / totalReviewed) * 100)
            : 0

        // distinct review days as ascending epoch-day numbers
        const epochDays = Array.from(new Set(history.map((row) => row.day)))
            .map((day) => this.toEpochDay(day))
            .sort((prev, next) => prev - next)

        const { currentStreak, longestStreak } = this.computeStreaks(
            epochDays,
            meta ? this.toEpochDay(meta.today) : 0,
        )

        return {
            currentStreak,
            longestStreak,
            retentionRate,
            totalReviewed,
            lastReviewedAt: meta?.last_reviewed_at ?? null,
            dailyReviewCounts: this.foldDailyCounts(history,
                meta),
            gradeDistribution: this.tallyGradeDistribution(history),
        }
    }

    /**
     * Tally graded reviews by SM-2 grade (0=Again, 1=Hard, 2=Good, 3=Easy) from
     * the same history scan {@link foldStats} already has in hand -- no extra query.
     *
     * @param history - one row per graded review (VN day + grade).
     * @returns the grade tally.
     */
    private tallyGradeDistribution(history: Array<ReviewHistoryRow>): FlashcardGradeDistribution {
        const distribution: FlashcardGradeDistribution = {
            again: 0,
            hard: 0,
            good: 0,
            easy: 0,
        }
        for (const row of history) {
            switch (row.grade) {
            case 0:
                distribution.again += 1
                break
            case 1:
                distribution.hard += 1
                break
            case 2:
                distribution.good += 1
                break
            case 3:
                distribution.easy += 1
                break
            default:
                // out-of-range grade (shouldn't happen) -- skip silently
                break
            }
        }
        return distribution
    }

    /**
     * Count reviews per VN day from the same history, retaining only the last
     * {@link DAILY_COUNTS_RETAIN_DAYS} days (relative to today) so the stored map
     * stays bounded. `history[].day` is ALREADY the VN calendar day (the SQL scan
     * casts `AT TIME ZONE 'Asia/Ho_Chi_Minh'`), so this is pure counting -- no
     * timezone math here.
     *
     * @param history - one row per graded review (VN day + grade).
     * @param meta - today (VN) + latest review timestamp.
     * @returns `YYYY-MM-DD` -> cards graded that day, within the retained window.
     */
    private foldDailyCounts(
        history: Array<ReviewHistoryRow>,
        meta: ReviewMetaRow | undefined,
    ): Record<string, number> {
        // no "today" anchor (never reviewed) -> nothing to retain a window against
        if (!meta) {
            return {
            }
        }
        const cutoffEpoch = this.toEpochDay(meta.today) - (DAILY_COUNTS_RETAIN_DAYS - 1)
        const counts: Record<string, number> = {
        }
        for (const row of history) {
            if (this.toEpochDay(row.day) < cutoffEpoch) {
                // older than the retained window -> drop (bounds the stored map)
                continue
            }
            counts[row.day] = (counts[row.day] ?? 0) + 1
        }
        return counts
    }

    /**
     * Compute the current + longest consecutive-day streaks from ascending
     * epoch-day numbers. The current streak counts only when the latest review day
     * is today or yesterday (else the run has lapsed -> 0).
     *
     * @param epochDaysAsc - distinct review days, ascending epoch-day numbers.
     * @param todayEpoch - today's epoch-day (VN).
     * @returns the current + longest streak lengths.
     */
    private computeStreaks(
        epochDaysAsc: Array<number>,
        todayEpoch: number,
    ): FlashcardStreaks {
        if (epochDaysAsc.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
            }
        }
        // longest run of consecutive days anywhere in the history
        let longestStreak = 1
        let run = 1
        for (let index = 1; index < epochDaysAsc.length; index += 1) {
            run = epochDaysAsc[index] - epochDaysAsc[index - 1] === 1 ? run + 1 : 1
            longestStreak = Math.max(longestStreak,
                run)
        }
        // current run ending at the latest day -- only "current" if reviewed
        // today or yesterday, otherwise the streak has lapsed
        const lastEpoch = epochDaysAsc[epochDaysAsc.length - 1]
        let currentStreak = 0
        if (todayEpoch - lastEpoch <= 1) {
            currentStreak = 1
            for (let index = epochDaysAsc.length - 1; index > 0; index -= 1) {
                if (epochDaysAsc[index] - epochDaysAsc[index - 1] === 1) {
                    currentStreak += 1
                } else {
                    break
                }
            }
        }
        return {
            currentStreak,
            longestStreak,
        }
    }

    /**
     * Convert a `YYYY-MM-DD` date string to an epoch-day number (days since epoch).
     *
     * @param day - the date string (already in the target timezone).
     * @returns the epoch-day number.
     */
    private toEpochDay(day: string): number {
        return Math.floor(Date.parse(`${day}T00:00:00Z`) / MS_PER_DAY)
    }

    /**
     * Coerce one jsonb value key to a finite number (0 when absent / non-numeric).
     *
     * @param value - the projection's jsonb value.
     * @param key - the metric key to read.
     * @returns the numeric metric, defaulting to 0.
     */
    private numberAt(
        value: Record<string, unknown>,
        key: string,
    ): number {
        const parsed = Number(value[key])
        return Number.isFinite(parsed) ? parsed : 0
    }

    /**
     * Read the projection row's jsonb value, recomputing first when missing or
     * stale (TTL lazy-refresh).
     *
     * @param userId - the user to read.
     * @returns the jsonb value (empty object when still absent).
     */
    private async readValue(userId: string): Promise<Record<string, unknown>> {
        let row = await this.entityManager.findOne(
            UserFlashcardStatsProjectionEntity,
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
                UserFlashcardStatsProjectionEntity,
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
}
