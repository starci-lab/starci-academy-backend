import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserFlashcardStatsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserFlashcardStatsParams,
    ReviewHistoryRow,
    ReviewMetaRow,
    UserFlashcardStatsParams,
    UserFlashcardStatsResult,
} from "./types"

/** SM-2 grade at/above which a review counts as "recalled" for retention. */
const RECALLED_GRADE = 2

/** Milliseconds in one day (for epoch-day math on `YYYY-MM-DD` strings). */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * CQRS projection service for a user's flashcard study stats. The history scan
 * over `flashcard_review_events` runs ONLY in {@link recompute}, which folds
 * `{ currentStreak, longestStreak, retentionRate, totalReviewed, lastReviewedAt }`
 * into the jsonb `value` keyed by user. {@link getStats} reads the flat row with a
 * TTL lazy-refresh; the CDC listener keeps it fresh on new review events.
 */
@Injectable()
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

        // one row per graded review (its VN day + grade) — the history to fold
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
        }
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
    ): UserFlashcardStatsResult {
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
        }
    }

    /**
     * Compute the current + longest consecutive-day streaks from ascending
     * epoch-day numbers. The current streak counts only when the latest review day
     * is today or yesterday (else the run has lapsed → 0).
     *
     * @param epochDaysAsc - distinct review days, ascending epoch-day numbers.
     * @param todayEpoch - today's epoch-day (VN).
     * @returns the current + longest streak lengths.
     */
    private computeStreaks(
        epochDaysAsc: Array<number>,
        todayEpoch: number,
    ): { currentStreak: number, longestStreak: number } {
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
        // current run ending at the latest day — only "current" if reviewed
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
        // missing / past freshness window → recompute + re-read
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
