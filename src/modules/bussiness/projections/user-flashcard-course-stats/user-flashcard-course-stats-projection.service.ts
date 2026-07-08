import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardCardEntity,
    FlashcardQuizSessionEntity,
    FlashcardQuizSessionResult,
    FlashcardQuizSessionWeakTag,
    FlashcardReviewSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserFlashcardCourseStatsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    FlashcardDeckStatData,
    FlashcardDueForecastPointData,
    FlashcardMasteryBreakdownData,
    FlashcardQuizTagStatData,
    FlashcardQuizTrendPointData,
    FlashcardQuizWeakTagLinkData,
    FlashcardReviewDeckStatData,
    RecomputeUserFlashcardCourseStatsParams,
    UserFlashcardCourseStatsParams,
    UserFlashcardCourseStatsResult,
} from "./types"

/**
 * How many most-recent completed sessions to scan for the aggregation —
 * bounds the aggregation cost; same reasoning + value as the inline services
 * this projection replaces (`MyFlashcardQuizStatsService.STATS_SESSION_SCAN_CAP` /
 * `MyFlashcardReviewStatsService.STATS_SESSION_SCAN_CAP`).
 */
const STATS_SESSION_SCAN_CAP = 50

/** How many of the most recent scanned quiz sessions feed the trend line. */
const STATS_TREND_LENGTH = 10

/** Upper bound on tags returned in `quizByTag` — a sane ceiling for the response payload. */
const STATS_MAX_TAGS = 20

/** How many VN-days forward `dueForecast` covers. */
const DUE_FORECAST_DAYS = 7

/** A card counts as "mastered" once its SM-2 repetitions reach this floor. */
const MASTERED_REPETITIONS = 2

/** Milliseconds in one day (for epoch-day math on `YYYY-MM-DD` strings). */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Raw groupBy row for "total cards per deck". */
interface DeckCardCountRow {
    deckId: string
    total: string
}

/** Raw row: cards due today (count only). */
interface DueTodayRow {
    count: string
}

/** Raw groupBy row: cards due per VN-day, within the forecast window. */
interface DueForecastRow {
    day: string
    count: string
}

/** Raw row: today's VN-calendar day (forecast window anchor). */
interface VnTodayRow {
    today: string
}

/** Raw row: reviewed/mastered counts on `user_flashcard_reviews`. */
interface MasteryRow {
    reviewedTotal: string
    mastered: string
}

/** Raw row: total card count across the enrollment's course decks. */
interface TotalCardsRow {
    total: string
}

/**
 * CQRS projection service for a user's flashcard COURSE stats — shared by both
 * the quick-quiz and review recap surfaces. The heavy scan/fold over
 * `flashcard_quiz_sessions` / `flashcard_review_sessions` / `flashcard_cards`
 * runs ONLY in {@link recompute} (the projector, triggered by CDC on both
 * source tables), building the aggregate jsonb. {@link getStats} reads the
 * flat row with a TTL lazy-refresh — no per-request scan/fold.
 *
 * This mirrors what `MyFlashcardQuizStatsService.compute` and
 * `MyFlashcardReviewStatsService.compute`'s `computeByDeck` used to do inline
 * on every read (a bounded ≤50-row scan + GROUP BY) — a violation of
 * `.claude/be/rules/cqrs-no-inline-aggregate.md` ("kể cả scale nhỏ").
 */
@Injectable()
export class UserFlashcardCourseStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the flashcard-course-stats aggregate for one
     * enrollment (idempotent).
     *
     * @param params - {@link RecomputeUserFlashcardCourseStatsParams}
     */
    async recompute(
        {
            enrollmentId,
            entityManager,
        }: RecomputeUserFlashcardCourseStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager

        const {
            quizTrend,
            quizByTag,
            quizByDeck,
            weakTagLinks,
            completedSessionCount,
        } = await this.computeQuiz(manager,
            enrollmentId)
        const reviewByDeck = await this.computeReview(manager,
            enrollmentId)
        const { dueToday, dueForecast, masteryBreakdown } = await this.computeDueAndMastery(manager,
            enrollmentId)

        const value: UserFlashcardCourseStatsResult = {
            quizTrend,
            quizByTag,
            quizByDeck,
            weakTagLinks,
            completedSessionCount,
            reviewByDeck,
            dueToday,
            dueForecast,
            masteryBreakdown,
        }

        await manager.query(
            `INSERT INTO user_flashcard_course_stats_projections (enrollment_id, value)
             VALUES ($1::uuid, $2::jsonb)
             ON CONFLICT (enrollment_id) DO UPDATE SET
                 value      = EXCLUDED.value,
                 updated_at = now()`,
            [
                enrollmentId,
                JSON.stringify(value),
            ],
        )
    }

    /**
     * Read an enrollment's flashcard-course stats, TTL lazy-refreshed.
     *
     * @param params - {@link UserFlashcardCourseStatsParams}
     * @returns the stats (zeroed/empty when the enrollment has no history / row).
     */
    async getStats(
        {
            enrollmentId,
        }: UserFlashcardCourseStatsParams,
    ): Promise<UserFlashcardCourseStatsResult> {
        let row = await this.entityManager.findOne(
            UserFlashcardCourseStatsProjectionEntity,
            {
                where: {
                    enrollmentId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                enrollmentId,
            })
            row = await this.entityManager.findOne(
                UserFlashcardCourseStatsProjectionEntity,
                {
                    where: {
                        enrollmentId,
                    },
                },
            )
        }
        const value = row?.value as Partial<UserFlashcardCourseStatsResult> | undefined
        return {
            quizTrend: value?.quizTrend ?? [],
            quizByTag: value?.quizByTag ?? [],
            quizByDeck: value?.quizByDeck ?? [],
            weakTagLinks: value?.weakTagLinks ?? [],
            completedSessionCount: value?.completedSessionCount ?? 0,
            reviewByDeck: value?.reviewByDeck ?? [],
            dueToday: value?.dueToday ?? 0,
            dueForecast: value?.dueForecast ?? [],
            masteryBreakdown: value?.masteryBreakdown ?? {
                mastered: 0,
                learning: 0,
                new: 0,
            },
        }
    }

    /**
     * The quick-quiz side of the aggregate — trend/byTag/byDeck, COPIED
     * verbatim (parameterized by `enrollmentId`) from
     * `MyFlashcardQuizStatsService.compute`/`computeByTag`/`computeByDeck`.
     */
    private async computeQuiz(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<{
        quizTrend: Array<FlashcardQuizTrendPointData>
        quizByTag: Array<FlashcardQuizTagStatData>
        quizByDeck: Array<FlashcardDeckStatData>
        weakTagLinks: Array<FlashcardQuizWeakTagLinkData>
        completedSessionCount: number
    }> {
        const sessions = await manager.find(
            FlashcardQuizSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollmentId,
                    },
                    status: "completed",
                },
                order: {
                    updatedAt: "DESC",
                },
                take: STATS_SESSION_SCAN_CAP,
            },
        )

        const weakTagLinks = this.computeWeakTagLinks(sessions)
        const completedSessionCount = sessions.length

        // `sessions` is newest-first (DESC); reverse to oldest-first, then take
        // the last N of that ascending list — i.e. the most recent N sessions,
        // oldest-of-those-first, which is what a left-to-right trend line wants
        const quizTrend = [...sessions]
            .reverse()
            .slice(-STATS_TREND_LENGTH)
            .map((session) => ({
                completedAt: session.updatedAt,
                coverage: session.coverage ?? 0,
                xpEarned: session.xpEarned,
            }))

        // gather the distinct cardIds referenced across every scanned
        // session's per-card results, so the card/tag/deck lookup below is
        // ONE query rather than N+1
        const cardIds = [...new Set(
            sessions.flatMap((session) => (session.results ?? []).map((result) => result.cardId)),
        )]

        if (cardIds.length === 0) {
            return {
                quizTrend,
                quizByTag: [],
                quizByDeck: [],
                weakTagLinks,
                completedSessionCount,
            }
        }

        // ONE query for both the tag breakdown and the deck breakdown — avoids
        // querying FlashcardCardEntity twice
        const cards = await manager.find(
            FlashcardCardEntity,
            {
                where: {
                    id: In(cardIds),
                },
                relations: {
                    deck: true,
                },
                select: {
                    id: true,
                    tags: true,
                    deckId: true,
                    deck: {
                        id: true,
                        title: true,
                    },
                },
            },
        )
        const cardById = new Map(cards.map((card) => [
            card.id,
            card,
        ]))

        const quizByTag = this.computeByTag(sessions,
            cardById)
        const quizByDeck = await this.computeByDeck(manager,
            sessions,
            cardById)

        return {
            quizTrend,
            quizByTag,
            quizByDeck,
            weakTagLinks,
            completedSessionCount,
        }
    }

    /** One per-card result's own correct/total ratio, guarding against a zero denominator. */
    private resultCoverage(result: FlashcardQuizSessionResult): number {
        const total = Math.max(0,
            Math.trunc(result.totalBlanks))
        if (total === 0) {
            return 0
        }
        const correct = Math.max(0,
            Math.min(Math.trunc(result.correctBlanks),
                total))
        return correct / total
    }

    /**
     * Accumulate per-tag correct/total across every (session, result) pair,
     * ranked by coverage descending and capped at {@link STATS_MAX_TAGS}.
     */
    private computeByTag(
        sessions: Array<FlashcardQuizSessionEntity>,
        cardById: Map<string, FlashcardCardEntity>,
    ): Array<FlashcardQuizTagStatData> {
        const correctByTag = new Map<string, number>()
        const totalByTag = new Map<string, number>()
        for (const session of sessions) {
            for (const result of session.results ?? []) {
                const card = cardById.get(result.cardId)
                if (!card) {
                    // card id not found (deleted / bad input) — skip silently
                    continue
                }
                const coverage = this.resultCoverage(result)
                for (const tag of card.tags) {
                    correctByTag.set(tag,
                        (correctByTag.get(tag) ?? 0) + coverage)
                    totalByTag.set(tag,
                        (totalByTag.get(tag) ?? 0) + 1)
                }
            }
        }

        return [...totalByTag.entries()]
            .map(([
                tag,
                total,
            ]) => ({
                tag,
                coverage: total === 0 ? 0 : (correctByTag.get(tag) ?? 0) / total,
            }))
            .sort((prev, next) => next.coverage - prev.coverage)
            .slice(0,
                STATS_MAX_TAGS)
    }

    /**
     * Derive the weakest-tags-with-a-study-link list from each session's
     * already-snapshotted `weakTags` (no re-derivation from `results[]`) —
     * walks `sessions` in their existing DESC (newest-first) order and keeps
     * ONLY the first (i.e. most recent) occurrence of each tag, then sorts
     * the kept occurrences by coverage ascending (weakest first), capped at
     * {@link STATS_MAX_TAGS}.
     */
    private computeWeakTagLinks(
        sessions: Array<FlashcardQuizSessionEntity>,
    ): Array<FlashcardQuizWeakTagLinkData> {
        const linkByTag = new Map<string, FlashcardQuizWeakTagLinkData>()
        for (const session of sessions) {
            for (const weakTag of session.weakTags ?? []) {
                if (linkByTag.has(weakTag.tag)) {
                    // already recorded this tag's MOST RECENT occurrence
                    // (sessions are newest-first) — skip older occurrences
                    continue
                }
                linkByTag.set(weakTag.tag,
                    this.toWeakTagLink(weakTag))
            }
        }

        return [...linkByTag.values()]
            .sort((prev, next) => prev.coverage - next.coverage)
            .slice(0,
                STATS_MAX_TAGS)
    }

    /** Normalize one session-snapshotted weak tag into the projection's link shape (undefined → null). */
    private toWeakTagLink(
        weakTag: FlashcardQuizSessionWeakTag,
    ): FlashcardQuizWeakTagLinkData {
        return {
            tag: weakTag.tag,
            coverage: weakTag.coverage,
            moduleId: weakTag.moduleId ?? null,
            contentId: weakTag.contentId ?? null,
        }
    }

    /**
     * Accumulate per-deck distinct-session touches + card-answer counts
     * across every scanned session, then resolve each touched deck's total
     * card count in one groupBy query.
     */
    private async computeByDeck(
        manager: EntityManager,
        sessions: Array<FlashcardQuizSessionEntity>,
        cardById: Map<string, FlashcardCardEntity>,
    ): Promise<Array<FlashcardDeckStatData>> {
        const sessionIdsByDeck = new Map<string, Set<string>>()
        const cardsAnsweredByDeck = new Map<string, number>()
        const deckTitleById = new Map<string, string>()

        for (const session of sessions) {
            for (const result of session.results ?? []) {
                const card = cardById.get(result.cardId)
                if (!card?.deck) {
                    continue
                }
                const deckId = card.deckId
                if (!sessionIdsByDeck.has(deckId)) {
                    sessionIdsByDeck.set(deckId,
                        new Set())
                }
                // a Set, so a deck answered twice in one session still counts as 1 session
                sessionIdsByDeck.get(deckId)?.add(session.id)
                cardsAnsweredByDeck.set(deckId,
                    (cardsAnsweredByDeck.get(deckId) ?? 0) + 1)
                deckTitleById.set(deckId,
                    card.deck.title)
            }
        }

        const deckIds = [...sessionIdsByDeck.keys()]
        if (deckIds.length === 0) {
            return []
        }

        // single groupBy query for every touched deck's total card count
        const totalRows = await manager
            .createQueryBuilder(FlashcardCardEntity,
                "card")
            .select("card.flashcard_deck_id",
                "deckId")
            .addSelect("COUNT(*)",
                "total")
            .where("card.flashcard_deck_id IN (:...deckIds)",
                {
                    deckIds,
                })
            .groupBy("card.flashcard_deck_id")
            .getRawMany<DeckCardCountRow>()
        const totalCardsByDeck = new Map(totalRows.map((row) => [
            row.deckId,
            Number(row.total) || 0,
        ]))

        return deckIds.map((deckId) => ({
            deckId,
            deckTitle: deckTitleById.get(deckId) ?? "",
            sessionCount: sessionIdsByDeck.get(deckId)?.size ?? 0,
            cardsAnswered: cardsAnsweredByDeck.get(deckId) ?? 0,
            totalCards: totalCardsByDeck.get(deckId) ?? 0,
        }))
    }

    /**
     * The review side of the aggregate — `reviewByDeck`, COPIED verbatim
     * (parameterized by `enrollmentId`) from
     * `MyFlashcardReviewStatsService.computeByDeck`.
     */
    private async computeReview(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<Array<FlashcardReviewDeckStatData>> {
        const sessions = await manager.find(
            FlashcardReviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollmentId,
                    },
                    status: "completed",
                },
                relations: {
                    deck: true,
                },
                order: {
                    updatedAt: "DESC",
                },
                take: STATS_SESSION_SCAN_CAP,
            },
        )

        if (sessions.length === 0) {
            return []
        }

        const sessionCountByDeck = new Map<string, number>()
        const cardsReviewedByDeck = new Map<string, number>()
        const deckTitleById = new Map<string, string>()

        for (const session of sessions) {
            const deckId = session.deckId
            sessionCountByDeck.set(deckId,
                (sessionCountByDeck.get(deckId) ?? 0) + 1)
            cardsReviewedByDeck.set(deckId,
                (cardsReviewedByDeck.get(deckId) ?? 0) + session.reviewedCount)
            if (session.deck) {
                deckTitleById.set(deckId,
                    session.deck.title)
            }
        }

        const deckIds = [...sessionCountByDeck.keys()]
        if (deckIds.length === 0) {
            return []
        }

        // single groupBy query for every touched deck's total card count
        const totalRows = await manager
            .createQueryBuilder(FlashcardCardEntity,
                "card")
            .select("card.flashcard_deck_id",
                "deckId")
            .addSelect("COUNT(*)",
                "total")
            .where("card.flashcard_deck_id IN (:...deckIds)",
                {
                    deckIds,
                })
            .groupBy("card.flashcard_deck_id")
            .getRawMany<DeckCardCountRow>()
        const totalCardsByDeck = new Map(totalRows.map((row) => [
            row.deckId,
            Number(row.total) || 0,
        ]))

        return deckIds.map((deckId) => ({
            deckId,
            deckTitle: deckTitleById.get(deckId) ?? "",
            sessionCount: sessionCountByDeck.get(deckId) ?? 0,
            cardsReviewed: cardsReviewedByDeck.get(deckId) ?? 0,
            totalCards: totalCardsByDeck.get(deckId) ?? 0,
        }))
    }

    /**
     * The due/mastery side of the aggregate — `dueToday`/`dueForecast`/
     * `masteryBreakdown`, all scoped to this enrollment via
     * `user_flashcard_reviews.enrollment_id` (+ the enrollment's course for
     * `totalCards`). 3 small raw aggregates, run ONLY here (never per-request).
     */
    private async computeDueAndMastery(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<{
        dueToday: number
        dueForecast: Array<FlashcardDueForecastPointData>
        masteryBreakdown: FlashcardMasteryBreakdownData
    }> {
        // 1. cards due right now
        const [dueTodayRow] = await manager.query<Array<DueTodayRow>>(
            `SELECT COUNT(*)::text AS count
             FROM user_flashcard_reviews
             WHERE enrollment_id = $1
               AND due_at <= now()`,
            [
                enrollmentId,
            ],
        )
        const dueToday = Number(dueTodayRow?.count) || 0

        // 2. cards due per VN-day over the next DUE_FORECAST_DAYS days —
        // grouped in SQL, zero-filled in JS (mirrors `foldDailyCounts` in
        // `UserFlashcardStatsProjectionService`)
        const forecastRows = await manager.query<Array<DueForecastRow>>(
            `SELECT (due_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day,
                    COUNT(*)::text AS count
             FROM user_flashcard_reviews
             WHERE enrollment_id = $1
               AND due_at > now()
               AND due_at <= now() + interval '7 days'
             GROUP BY day`,
            [
                enrollmentId,
            ],
        )
        const forecastCountByDay = new Map(forecastRows.map((row) => [
            row.day,
            Number(row.count) || 0,
        ]))
        const [todayRow] = await manager.query<Array<VnTodayRow>>(
            "SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS today",
        )
        const [
            year,
            month,
            day,
        ] = todayRow.today.split("-").map(Number)
        const anchor = Date.UTC(year,
            month - 1,
            day)
        const dueForecast: Array<FlashcardDueForecastPointData> = []
        for (let offset = 1; offset <= DUE_FORECAST_DAYS; offset += 1) {
            const date = new Date(anchor + offset * MS_PER_DAY).toISOString().slice(0,
                10)
            dueForecast.push({
                date,
                count: forecastCountByDay.get(date) ?? 0,
            })
        }

        // 3. reviewed/mastered tally on this enrollment's reviews
        const [masteryRow] = await manager.query<Array<MasteryRow>>(
            `SELECT COUNT(*)::text AS "reviewedTotal",
                    COUNT(*) FILTER (WHERE repetitions >= ${MASTERED_REPETITIONS})::text AS mastered
             FROM user_flashcard_reviews
             WHERE enrollment_id = $1`,
            [
                enrollmentId,
            ],
        )
        const reviewedTotal = Number(masteryRow?.reviewedTotal) || 0
        const mastered = Number(masteryRow?.mastered) || 0

        // this enrollment's course's total card count (across every deck)
        const [totalCardsRow] = await manager.query<Array<TotalCardsRow>>(
            `SELECT COUNT(*)::text AS total
             FROM flashcard_cards card
             JOIN flashcard_decks deck ON deck.id = card.flashcard_deck_id
             JOIN enrollments enrollment ON enrollment.course_id = deck.course_id
             WHERE enrollment.id = $1`,
            [
                enrollmentId,
            ],
        )
        const totalCards = Number(totalCardsRow?.total) || 0

        return {
            dueToday,
            dueForecast,
            masteryBreakdown: {
                mastered,
                learning: reviewedTotal - mastered,
                new: Math.max(0,
                    totalCards - reviewedTotal),
            },
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
