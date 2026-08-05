import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardQuizSessionEntity,
    FlashcardQuizSessionResult,
    FlashcardQuizSessionWeakTag,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    FlashcardReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-session.entity"
import {
    UserFlashcardCourseStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-course-stats-projection.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    FlashcardBestReviewHourData,
    FlashcardConceptCoverageData,
    FlashcardDeckRetentionData,
    FlashcardDeckStatData,
    FlashcardDifficultyMixData,
    FlashcardDueForecastPointData,
    FlashcardForgetSoonData,
    FlashcardLeechCardData,
    FlashcardLeechFocusCardData,
    FlashcardMasteryBreakdownData,
    FlashcardMaturityLadderData,
    FlashcardQuizHardCardData,
    FlashcardQuizTagStatData,
    FlashcardQuizTrendPointData,
    FlashcardQuizWeakTagLinkData,
    FlashcardRetentionTrendPointData,
    FlashcardReviewDeckStatData,
    FlashcardWeakReviewTagData,
    FlashcardWeakTagData,
    RecomputeUserFlashcardCourseStatsParams,
    UserFlashcardCourseStatsParams,
    UserFlashcardCourseStatsResult,
} from "./types"

/**
 * How many most-recent completed sessions to scan for the aggregation --
 * bounds the aggregation cost; same reasoning + value as the inline services
 * this projection replaces (`MyFlashcardQuizStatsService.STATS_SESSION_SCAN_CAP` /
 * `MyFlashcardReviewStatsService.STATS_SESSION_SCAN_CAP`).
 */
const STATS_SESSION_SCAN_CAP = 50

/** How many of the most recent scanned quiz sessions feed the trend line. */
const STATS_TREND_LENGTH = 10

/** Upper bound on tags returned in `quizByTag` -- a sane ceiling for the response payload. */
const STATS_MAX_TAGS = 20

/** Max frequently-missed quiz cards surfaced -- a tight, actionable list (mirrors `LEECH_LIMIT`). */
const QUIZ_HARD_CARD_LIMIT = 5

/** Minimum times a card must be answered before it's eligible to be a "hard" card (avoid a 1-off miss). */
const QUIZ_HARD_CARD_MIN_ATTEMPTS = 2

/** How many VN-days forward `dueForecast` covers. */
const DUE_FORECAST_DAYS = 7

/** A card counts as "mastered" once its SM-2 repetitions reach this floor. */
const MASTERED_REPETITIONS = 2

/** SM-2 grade at/above which a review counts as a successful recall (retention numerator). */
const RECALLED_GRADE = 2

/** Max leech cards surfaced (needs-review hero) -- a tight, actionable list. */
const LEECH_LIMIT = 5

/** Minimum graded reviews a card needs before it can be flagged a leech (avoid a 1-off Again). */
const LEECH_MIN_AGAIN = 2

/** Minimum graded reviews a TAG needs before it's eligible to be "the weakest tag" (sample-size floor). */
const WEAK_TAG_MIN_SAMPLE = 4

/** How many trailing VN-days the retention trend covers. */
const RETENTION_TREND_DAYS = 30

/** Milliseconds in one day (for epoch-day math on `YYYY-MM-DD` strings). */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * `interval_days` cut between "young" and "mature" for {@link FlashcardMaturityLadderData}
 * (young: 1..this inclusive; mature: strictly above). A SEPARATE, slightly
 * different cut from {@link RETENTION_MATURE_THRESHOLD_DAYS} -- the ladder is a
 * headcount bucket (3-way split), the retention split is a 2-way "is recall
 * worse on new material or on stuff I've already committed" diagnosis; PO
 * 2026-07-17 spec gave each its own boundary.
 */
const MATURITY_LADDER_YOUNG_MAX_DAYS = 21

/** `interval_days` cut for the mature-vs-young RETENTION split (>= this = mature). See {@link MATURITY_LADDER_YOUNG_MAX_DAYS} for why this isn't shared. */
const RETENTION_MATURE_THRESHOLD_DAYS = 21

/** Out of the 7-day `dueForecast` window, how many leading days sum into the `forgetSoon.count` headline. */
const FORGET_SOON_HEADLINE_DAYS = 2

/** Minimum repeated-Hard grades before a card counts as "stuck" (never forgets outright, never firms up either). */
const STUCK_HARD_MIN_COUNT = 2

/** Max cards surfaced in `leechFocus` -- a tight, actionable rewrite list (mirrors `LEECH_LIMIT`). */
const LEECH_FOCUS_LIMIT = 8

/** Minimum graded reviews an HOUR-of-day bucket needs before it's eligible to be "the best review hour" (sample-size floor). */
const BEST_HOUR_MIN_SAMPLE = 5

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

/** Raw row: one leech card (most-forgotten), with its owning deck. */
interface LeechCardRow {
    card_id: string
    question: string
    forgot_count: string
    deck_id: string
    deck_title: string
}

/** Raw row: one deck's review recalled/total. */
interface DeckRetentionRow {
    deck_id: string
    deck_title: string
    recalled: string
    total: string
}

/** Raw row: one VN-day's review recalled/total. */
interface RetentionTrendRow {
    day: string
    recalled: string
    total: string
}

/** Raw groupBy row: one tag's review recalled/total + distinct card count. */
interface TagRetentionWithCardCountRow {
    tag: string
    recalled: string
    total: string
    card_count: string
}

/** Raw row: `user_flashcard_reviews` bucketed by `interval_days` into the 3-way maturity ladder. */
interface MaturityLadderRow {
    learning: string
    young: string
    mature: string
}

/** Raw row: recalled/total split by whether the card's CURRENT `interval_days` is mature or young. */
interface MaturityRetentionRow {
    matureRecalled: string
    matureTotal: string
    youngRecalled: string
    youngTotal: string
}

/** Raw row: one card's lapsed/stuck-Hard tallies (see {@link FlashcardLeechFocusCardData}). */
interface LeechFocusRow {
    card_id: string
    question: string
    deck_id: string
    deck_title: string
    lapsed_count: string
    hard_count: string
}

/** Raw row: one hour-of-day's recalled/total (VN local time). */
interface BestHourRow {
    hour: number
    recalled: string
    total: string
}

/** Raw row: distinct tag count across every card in a course's decks. */
interface CourseTagCountRow {
    total: string
}

@Injectable()
/**
 * CQRS projection service for a user's flashcard COURSE stats -- shared by both
 * the quick-quiz and review recap surfaces. The heavy scan/fold over
 * `flashcard_quiz_sessions` / `flashcard_review_sessions` / `flashcard_cards`
 * runs ONLY in {@link recompute} (the projector, triggered by CDC on both
 * source tables), building the aggregate jsonb. {@link getStats} reads the
 * flat row with a TTL lazy-refresh -- no per-request scan/fold.
 *
 * This mirrors what `MyFlashcardQuizStatsService.compute` and
 * `MyFlashcardReviewStatsService.compute`'s `computeByDeck` used to do inline
 * on every read (a bounded <=50-row scan + GROUP BY) -- a violation of
 * `.claude/be/rules/cqrs-no-inline-aggregate.md` (even at small scale).
 */
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
            quizHardCards,
            completedSessionCount,
            difficultyMix,
            conceptCoverage,
        } = await this.computeQuiz(manager,
            enrollmentId)
        const reviewByDeck = await this.computeReview(manager,
            enrollmentId)
        const {
            dueToday,
            dueForecast,
            masteryBreakdown,
            maturityLadder,
            forgetSoon,
        } = await this.computeDueAndMastery(manager,
            enrollmentId)
        const {
            leechCards,
            leechFocus,
            weakReviewTag,
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            bestReviewHour,
            deckRetention,
            retentionTrend,
        } = await this.computeReviewOutcome(manager,
            enrollmentId)

        const value: UserFlashcardCourseStatsResult = {
            quizTrend,
            quizByTag,
            quizByDeck,
            weakTagLinks,
            quizHardCards,
            completedSessionCount,
            difficultyMix,
            conceptCoverage,
            reviewByDeck,
            dueToday,
            dueForecast,
            masteryBreakdown,
            maturityLadder,
            forgetSoon,
            leechCards,
            leechFocus,
            weakReviewTag,
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            bestReviewHour,
            deckRetention,
            retentionTrend,
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
        // missing / past freshness window / SCHEMA-DRIFTED (a fresh row written
        // before the outcome fields existed lacks `leechCards` etc. -- recompute
        // once so those keys populate instead of reading as empty forever, PO
        // 2026-07-13: leech/chart fields missing after schema drift).
        const missingOutcomeFields = row
            ? (() => {
                const value = row.value as Partial<UserFlashcardCourseStatsResult> | undefined
                // leechCards = review-outcome drift (2026-07-13); quizHardCards =
                // quiz-outcome drift (added later); maturityLadder = the
                // stats-insight-redesign drift (2026-07-17, this batch of new
                // fields); reviewedTotal = the course-scoped floor/hero drift
                // (2026-07-17, same day, added after maturityLadder shipped) --
                // any absent means the row predates that fold, so recompute once
                // to populate it.
                return value?.leechCards === undefined
                    || value?.quizHardCards === undefined
                    || value?.maturityLadder === undefined
                    || value?.reviewedTotal === undefined
            })()
            : false
        if (!row || this.isStale(row.updatedAt) || missingOutcomeFields) {
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
            quizHardCards: value?.quizHardCards ?? [],
            completedSessionCount: value?.completedSessionCount ?? 0,
            difficultyMix: value?.difficultyMix ?? {
                junior: 0,
                middle: 0,
                senior: 0,
            },
            conceptCoverage: value?.conceptCoverage ?? null,
            reviewByDeck: value?.reviewByDeck ?? [],
            dueToday: value?.dueToday ?? 0,
            dueForecast: value?.dueForecast ?? [],
            masteryBreakdown: value?.masteryBreakdown ?? {
                mastered: 0,
                learning: 0,
                new: 0,
            },
            maturityLadder: value?.maturityLadder ?? {
                learning: 0,
                young: 0,
                mature: 0,
            },
            forgetSoon: value?.forgetSoon ?? {
                count: 0,
                horizonDays: DUE_FORECAST_DAYS,
                byDay: [],
            },
            leechCards: value?.leechCards ?? [],
            leechFocus: value?.leechFocus ?? [],
            weakReviewTag: value?.weakReviewTag ?? null,
            weakTags: value?.weakTags ?? [],
            matureRetention: value?.matureRetention ?? 0,
            youngRetention: value?.youngRetention ?? 0,
            reviewedTotal: value?.reviewedTotal ?? 0,
            courseRetention: value?.courseRetention ?? 0,
            bestReviewHour: value?.bestReviewHour ?? null,
            deckRetention: value?.deckRetention ?? [],
            retentionTrend: value?.retentionTrend ?? [],
        }
    }

    /**
     * The quick-quiz side of the aggregate -- trend/byTag/byDeck, COPIED
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
        quizHardCards: Array<FlashcardQuizHardCardData>
        completedSessionCount: number
        difficultyMix: FlashcardDifficultyMixData
        conceptCoverage: FlashcardConceptCoverageData | null
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
        const difficultyMix = this.computeDifficultyMix(sessions)

        // `sessions` is newest-first (DESC); reverse to oldest-first, then take
        // the last N of that ascending list -- i.e. the most recent N sessions,
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
                quizHardCards: [],
                completedSessionCount,
                difficultyMix,
                conceptCoverage: await this.computeConceptCoverage(manager,
                    enrollmentId,
                    new Set()),
            }
        }

        // ONE query for both the tag breakdown and the deck breakdown -- avoids
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
                // NO `deckId` here: it is a virtual `@RelationId` on
                // FlashcardCardEntity, and TypeORM's find `select` only accepts real
                // columns/relations -- listing it throws EntityPropertyNotFoundError
                // ("Property \"deckId\" was not found in \"FlashcardCardEntity\"") at
                // RUNTIME, which killed `recompute()` on its FIRST fold (computeQuiz)
                // and so silently left EVERY flashcard course-stat empty since
                // b0c780f4. Nothing reads `card.deckId` here anyway -- the deck comes
                // from the `deck` relation below (2026-07-17 fix).
                select: {
                    id: true,
                    question: true,
                    tags: true,
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
        const quizHardCards = this.computeQuizHardCards(sessions,
            cardById)
        // distinct tags actually attempted = every tag on every scanned card,
        // straight off the same `cards` fetch above (no extra query)
        const attemptedTags = new Set(cards.flatMap((card) => card.tags))
        const conceptCoverage = await this.computeConceptCoverage(manager,
            enrollmentId,
            attemptedTags)

        return {
            quizTrend,
            quizByTag,
            quizByDeck,
            weakTagLinks,
            quizHardCards,
            completedSessionCount,
            difficultyMix,
            conceptCoverage,
        }
    }

    /**
     * Bucket completed quiz sessions by their `level` filter -- Staff folds
     * into `senior` (the FE only shows 3 difficulty buckets) and sessions
     * drawn with NO level filter ("all levels") are excluded, since they
     * can't be attributed to a single difficulty.
     */
    private computeDifficultyMix(
        sessions: Array<FlashcardQuizSessionEntity>,
    ): FlashcardDifficultyMixData {
        const mix: FlashcardDifficultyMixData = {
            junior: 0,
            middle: 0,
            senior: 0,
        }
        for (const session of sessions) {
            switch (session.level) {
            case "junior":
                mix.junior += 1
                break
            case "middle":
                mix.middle += 1
                break
            case "senior":
            case "staff":
                mix.senior += 1
                break
            default:
                // null ("all levels") -- not attributable to one bucket, skip
                break
            }
        }
        return mix
    }

    /**
     * How many of the course's technology tags the learner has attempted vs
     * how many exist -- `total` is a real `COUNT(DISTINCT tag)` over the
     * course's decks (cheap: one query, mirrors the `totalCardsRow` pattern in
     * {@link computeDueAndMastery}), not the byTag-length approximation the
     * spec allows as a fallback. Null only when the course itself has no tag
     * data to compare against (guards a divide-by-zero on the FE).
     */
    private async computeConceptCoverage(
        manager: EntityManager,
        enrollmentId: string,
        attemptedTags: Set<string>,
    ): Promise<FlashcardConceptCoverageData | null> {
        const [row] = await manager.query<Array<CourseTagCountRow>>(
            `SELECT COUNT(DISTINCT tag.value)::text AS total
             FROM flashcard_cards card
             JOIN flashcard_decks deck ON deck.id = card.flashcard_deck_id
             JOIN enrollments enrollment ON enrollment.course_id = deck.course_id
             CROSS JOIN LATERAL jsonb_array_elements_text(card.tags) AS tag(value)
             WHERE enrollment.id = $1`,
            [
                enrollmentId,
            ],
        )
        const total = Number(row?.total) || 0
        if (total === 0) {
            return null
        }
        return {
            covered: attemptedTags.size,
            total,
        }
    }

    /**
     * The quiz OUTCOME diagnosis (PO 2026-07-13 quiz-stats redesign -- lead
     * with gaps, not vanity) -- the frequently-missed quiz list, the quiz analogue of a review
     * leech. Folds each (session, result) pair from `results[]` per card:
     * aggregate coverage = ΣcorrectBlanks / ΣtotalBlanks, `attempts` = times
     * answered, `wrongCount` = attempts with any blank missed (coverage < 1). Only
     * cards answered >= {@link QUIZ_HARD_CARD_MIN_ATTEMPTS} times qualify (avoid a
     * 1-off miss), ranked lowest coverage first, capped at
     * {@link QUIZ_HARD_CARD_LIMIT}. Derived from the same in-memory `sessions` +
     * `cardById` the tag/deck folds use -- no extra query.
     */
    private computeQuizHardCards(
        sessions: Array<FlashcardQuizSessionEntity>,
        cardById: Map<string, FlashcardCardEntity>,
    ): Array<FlashcardQuizHardCardData> {
        const correctByCard = new Map<string, number>()
        const totalByCard = new Map<string, number>()
        const attemptsByCard = new Map<string, number>()
        const wrongByCard = new Map<string, number>()

        for (const session of sessions) {
            for (const result of session.results ?? []) {
                if (!cardById.has(result.cardId)) {
                    // card id not found (deleted / bad input) -- skip silently
                    continue
                }
                const total = Math.max(0,
                    Math.trunc(result.totalBlanks))
                const correct = Math.max(0,
                    Math.min(Math.trunc(result.correctBlanks),
                        total))
                correctByCard.set(result.cardId,
                    (correctByCard.get(result.cardId) ?? 0) + correct)
                totalByCard.set(result.cardId,
                    (totalByCard.get(result.cardId) ?? 0) + total)
                attemptsByCard.set(result.cardId,
                    (attemptsByCard.get(result.cardId) ?? 0) + 1)
                if (correct < total) {
                    wrongByCard.set(result.cardId,
                        (wrongByCard.get(result.cardId) ?? 0) + 1)
                }
            }
        }

        return [...attemptsByCard.entries()]
            .filter(([, attempts]) => attempts >= QUIZ_HARD_CARD_MIN_ATTEMPTS)
            .map(([cardId]) => {
                const card = cardById.get(cardId)
                const total = totalByCard.get(cardId) ?? 0
                return {
                    cardId,
                    question: card?.question ?? "",
                    attempts: attemptsByCard.get(cardId) ?? 0,
                    wrongCount: wrongByCard.get(cardId) ?? 0,
                    coverage: total === 0 ? 0 : (correctByCard.get(cardId) ?? 0) / total,
                    deckId: card?.deckId ?? "",
                    deckTitle: card?.deck?.title ?? "",
                }
            })
            .sort((prev, next) => prev.coverage - next.coverage || next.wrongCount - prev.wrongCount)
            .slice(0,
                QUIZ_HARD_CARD_LIMIT)
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
                    // card id not found (deleted / bad input) -- skip silently
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
     * already-snapshotted `weakTags` (no re-derivation from `results[]`) --
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
                    // (sessions are newest-first) -- skip older occurrences
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

    /** Normalize one session-snapshotted weak tag into the projection's link shape (undefined -> null). */
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
     * The review side of the aggregate -- `reviewByDeck`, COPIED verbatim
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
     * The due/mastery side of the aggregate -- `dueToday`/`dueForecast`/
     * `masteryBreakdown`/`maturityLadder`/`forgetSoon`, all scoped to this
     * enrollment via `user_flashcard_reviews.enrollment_id` (+ the
     * enrollment's course for `totalCards`). Small raw aggregates, run ONLY
     * here (never per-request).
     */
    private async computeDueAndMastery(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<{
        dueToday: number
        dueForecast: Array<FlashcardDueForecastPointData>
        masteryBreakdown: FlashcardMasteryBreakdownData
        maturityLadder: FlashcardMaturityLadderData
        forgetSoon: FlashcardForgetSoonData
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

        // 2. cards due per VN-day over the next DUE_FORECAST_DAYS days --
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

        // 4. maturity LADDER -- a coarser, interval_days-based 3-way cut
        // (learning/young/mature) than the repetitions-based masteryBreakdown
        // above; "never reviewed" cards fold into `learning` (PO 2026-07-17:
        // only 8% mature = true progress).
        const [ladderRow] = await manager.query<Array<MaturityLadderRow>>(
            `SELECT COUNT(*) FILTER (WHERE interval_days < 1)::text AS learning,
                    COUNT(*) FILTER (WHERE interval_days >= 1 AND interval_days <= ${MATURITY_LADDER_YOUNG_MAX_DAYS})::text AS young,
                    COUNT(*) FILTER (WHERE interval_days > ${MATURITY_LADDER_YOUNG_MAX_DAYS})::text AS mature
             FROM user_flashcard_reviews
             WHERE enrollment_id = $1`,
            [
                enrollmentId,
            ],
        )
        const neverReviewed = Math.max(0,
            totalCards - reviewedTotal)
        const maturityLadder: FlashcardMaturityLadderData = {
            learning: (Number(ladderRow?.learning) || 0) + neverReviewed,
            young: Number(ladderRow?.young) || 0,
            mature: Number(ladderRow?.mature) || 0,
        }

        // 5. forget SOON -- same 7-day-forward series as `dueForecast` (no
        // extra query), just a leading-window sum for the forget-soon headline.
        const forgetSoon: FlashcardForgetSoonData = {
            count: dueForecast
                .slice(0,
                    FORGET_SOON_HEADLINE_DAYS)
                .reduce((sum, point) => sum + point.count,
                    0),
            horizonDays: DUE_FORECAST_DAYS,
            byDay: dueForecast,
        }

        return {
            dueToday,
            dueForecast,
            masteryBreakdown: {
                mastered,
                learning: reviewedTotal - mastered,
                new: neverReviewed,
            },
            maturityLadder,
            forgetSoon,
        }
    }

    /**
     * The review-OUTCOME side of the aggregate (PO 2026-07-13 stats tab was
     * meaningless -- rebuild it; lead with what needs fixing, not vanity effort): the
     * outcome aggregates that turn the stats tab into a fix-funnel --
     * `leechCards`/`leechFocus` (kept forgetting), `weakReviewTag`/`weakTags`
     * (worst-retention tag(s)), `deckRetention` (outcome per deck vs the
     * footprint `reviewByDeck`), `retentionTrend` (improving?), the
     * mature-vs-young retention split, and `bestReviewHour`. All derived from
     * `flashcard_review_events` (the SM-2 grade log) joined to the
     * enrollment's course cards -- scoped to this enrollment's USER (events
     * are user-keyed) and COURSE (card -> deck -> course), and folded HERE only
     * (CDC-triggered), never per-request
     * (`.claude/be/rules/cqrs-no-inline-aggregate.md`). `recalled` = grade >=
     * {@link RECALLED_GRADE}; retention = recalled/total x 100.
     */
    private async computeReviewOutcome(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<{
        leechCards: Array<FlashcardLeechCardData>
        leechFocus: Array<FlashcardLeechFocusCardData>
        weakReviewTag: FlashcardWeakReviewTagData | null
        weakTags: Array<FlashcardWeakTagData>
        matureRetention: number
        youngRetention: number
        reviewedTotal: number
        courseRetention: number
        bestReviewHour: FlashcardBestReviewHourData | null
        deckRetention: Array<FlashcardDeckRetentionData>
        retentionTrend: Array<FlashcardRetentionTrendPointData>
    }> {
        // Shared scope: this enrollment's own user's events on THIS course's cards.
        // `enrollments en` resolves both the user (event owner) and the course
        // (deck filter) from the single enrollment id, so every query below joins
        // events ⋈ cards ⋈ decks ⋈ enrollment without leaking another user's grades.
        const scopeJoin = `
            FROM flashcard_review_events e
            JOIN enrollments en ON en.id = $1 AND e.user_id = en.user_id
            JOIN flashcard_cards card ON card.id = e.flashcard_card_id
            JOIN flashcard_decks deck ON deck.id = card.flashcard_deck_id AND deck.course_id = en.course_id`

        // 1. LEECH -- cards graded Again the most (>= LEECH_MIN_AGAIN times), top LEECH_LIMIT.
        const leechRows = await manager.query<Array<LeechCardRow>>(
            `SELECT card.id AS card_id,
                    card.question AS question,
                    COUNT(*) FILTER (WHERE e.grade = 0)::text AS forgot_count,
                    deck.id AS deck_id,
                    deck.title AS deck_title
             ${scopeJoin}
             GROUP BY card.id, card.question, deck.id, deck.title
             HAVING COUNT(*) FILTER (WHERE e.grade = 0) >= ${LEECH_MIN_AGAIN}
             ORDER BY forgot_count DESC, card.id ASC
             LIMIT ${LEECH_LIMIT}`,
            [
                enrollmentId,
            ],
        )
        const leechCards: Array<FlashcardLeechCardData> = leechRows.map((row) => ({
            cardId: row.card_id,
            question: row.question ?? "",
            forgotCount: Number(row.forgot_count) || 0,
            deckId: row.deck_id,
            deckTitle: row.deck_title ?? "",
        }))

        // 2. WEAK TAGS -- EVERY tag's retention with >= WEAK_TAG_MIN_SAMPLE graded
        // reviews, worst-first (PO 2026-07-17: drop LIMIT 1 -- the old query
        // only ever surfaced the single worst tag; `weakReviewTag` below is now
        // just this same list's head, no second query). `card.tags` is a jsonb
        // string array -> unnest with jsonb_array_elements_text.
        const tagRows = await manager.query<Array<TagRetentionWithCardCountRow>>(
            `SELECT tag.value AS tag,
                    COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::text AS recalled,
                    COUNT(*)::text AS total,
                    COUNT(DISTINCT card.id)::text AS card_count
             ${scopeJoin}
             CROSS JOIN LATERAL jsonb_array_elements_text(card.tags) AS tag(value)
             GROUP BY tag.value
             HAVING COUNT(*) >= ${WEAK_TAG_MIN_SAMPLE}
             ORDER BY (COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::float / COUNT(*)) ASC,
                      total DESC`,
            [
                enrollmentId,
            ],
        )
        const weakTags: Array<FlashcardWeakTagData> = tagRows.map((row) => ({
            tag: row.tag,
            retention: this.retentionPercent(row.recalled,
                row.total),
            cardCount: Number(row.card_count) || 0,
        }))
        const weakReviewTag: FlashcardWeakReviewTagData | null = tagRows.length > 0
            ? {
                tag: tagRows[0].tag,
                retention: this.retentionPercent(tagRows[0].recalled,
                    tagRows[0].total),
                reviewCount: Number(tagRows[0].total) || 0,
            }
            : null

        // 3. DECK RETENTION -- recalled/total per deck, weakest first (outcome, not footprint).
        const deckRows = await manager.query<Array<DeckRetentionRow>>(
            `SELECT deck.id AS deck_id,
                    deck.title AS deck_title,
                    COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::text AS recalled,
                    COUNT(*)::text AS total
             ${scopeJoin}
             GROUP BY deck.id, deck.title
             ORDER BY (COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::float / COUNT(*)) ASC,
                      total DESC`,
            [
                enrollmentId,
            ],
        )
        const deckRetention: Array<FlashcardDeckRetentionData> = deckRows.map((row) => ({
            deckId: row.deck_id,
            deckTitle: row.deck_title ?? "",
            retention: this.retentionPercent(row.recalled,
                row.total),
            reviewCount: Number(row.total) || 0,
        }))

        // 4. RETENTION TREND -- recalled/total per VN-day over the trailing window,
        // only days WITH reviews (the FE line skips gaps), most-recent last.
        const trendRows = await manager.query<Array<RetentionTrendRow>>(
            `SELECT (e.reviewed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day,
                    COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::text AS recalled,
                    COUNT(*)::text AS total
             ${scopeJoin}
             AND e.reviewed_at >= now() - interval '${RETENTION_TREND_DAYS} days'
             GROUP BY day
             ORDER BY day ASC`,
            [
                enrollmentId,
            ],
        )
        const retentionTrend: Array<FlashcardRetentionTrendPointData> = trendRows.map((row) => ({
            date: row.day,
            retention: this.retentionPercent(row.recalled,
                row.total),
            reviewCount: Number(row.total) || 0,
        }))

        // 5. MATURE vs YOUNG retention -- is forgetting concentrated on freshly-seen
        // cards (young, still spacing out) or on stuff already committed (mature)?
        // Joins the event log to the CURRENT `user_flashcard_reviews.interval_days`
        // (an approximation: buckets by the card's interval NOW, not at each past
        // event's time -- cheap and stable enough for a "where's the problem" split).
        const [maturityRetentionRow] = await manager.query<Array<MaturityRetentionRow>>(
            `SELECT COUNT(*) FILTER (WHERE r.interval_days >= ${RETENTION_MATURE_THRESHOLD_DAYS} AND e.grade >= ${RECALLED_GRADE})::text AS "matureRecalled",
                    COUNT(*) FILTER (WHERE r.interval_days >= ${RETENTION_MATURE_THRESHOLD_DAYS})::text AS "matureTotal",
                    COUNT(*) FILTER (WHERE r.interval_days < ${RETENTION_MATURE_THRESHOLD_DAYS} AND e.grade >= ${RECALLED_GRADE})::text AS "youngRecalled",
                    COUNT(*) FILTER (WHERE r.interval_days < ${RETENTION_MATURE_THRESHOLD_DAYS})::text AS "youngTotal"
             ${scopeJoin}
             JOIN user_flashcard_reviews r ON r.flashcard_card_id = card.id AND r.enrollment_id = en.id`,
            [
                enrollmentId,
            ],
        )
        const matureRetention = this.retentionPercent(
            maturityRetentionRow?.matureRecalled ?? "0",
            maturityRetentionRow?.matureTotal ?? "0",
        )
        const youngRetention = this.retentionPercent(
            maturityRetentionRow?.youngRecalled ?? "0",
            maturityRetentionRow?.youngTotal ?? "0",
        )
        // COURSE-SCOPED review volume + retention -- the mature/young split above
        // already scanned exactly this course's graded events, so summing its two
        // buckets costs no extra query. These are what the Statistics tab's floor +
        // memory-health hero must read: the per-USER lifetime `totalReviewed`/
        // `retentionRate` blend every course together, which is wrong for a
        // course-scoped tab (2026-07-17).
        const reviewedTotal = (Number(maturityRetentionRow?.matureTotal) || 0)
            + (Number(maturityRetentionRow?.youngTotal) || 0)
        const courseRetention = this.retentionPercent(
            String((Number(maturityRetentionRow?.matureRecalled) || 0)
                + (Number(maturityRetentionRow?.youngRecalled) || 0)),
            String(reviewedTotal),
        )

        // 6. LEECH FOCUS -- reason-tagged rewrite list: `lapsed` = graded Again
        // AFTER at least one prior Good/Easy on the SAME card (learned it once,
        // then forgot); `stuckHard` = repeatedly graded Hard (never forgets
        // outright, never firms up either). The window function looks ONLY at
        // rows strictly BEFORE the current one (`ROWS BETWEEN UNBOUNDED
        // PRECEDING AND 1 PRECEDING`) so "prior recall" never counts the
        // current grade against itself.
        const leechFocusRows = await manager.query<Array<LeechFocusRow>>(
            `WITH events AS (
                 SELECT card.id AS card_id,
                        card.question AS question,
                        deck.id AS deck_id,
                        deck.title AS deck_title,
                        e.grade,
                        MAX(CASE WHEN e.grade >= ${RECALLED_GRADE} THEN 1 ELSE 0 END) OVER (
                            PARTITION BY card.id
                            ORDER BY e.reviewed_at
                            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                        ) AS had_prior_recall
                 ${scopeJoin}
             ),
             tally AS (
                 SELECT card_id, question, deck_id, deck_title,
                        COUNT(*) FILTER (WHERE grade = 0 AND had_prior_recall = 1) AS lapsed_count,
                        COUNT(*) FILTER (WHERE grade = 1) AS hard_count
                 FROM events
                 GROUP BY card_id, question, deck_id, deck_title
             )
             SELECT card_id, question, deck_id, deck_title,
                    lapsed_count::text AS lapsed_count,
                    hard_count::text AS hard_count
             FROM tally
             WHERE lapsed_count > 0 OR hard_count >= ${STUCK_HARD_MIN_COUNT}
             ORDER BY GREATEST(lapsed_count, hard_count) DESC, card_id ASC
             LIMIT ${LEECH_FOCUS_LIMIT}`,
            [
                enrollmentId,
            ],
        )
        const leechFocus: Array<FlashcardLeechFocusCardData> = leechFocusRows.map((row) => {
            const lapsedCount = Number(row.lapsed_count) || 0
            const hardCount = Number(row.hard_count) || 0
            // lapsed takes priority -- "learned it once, then forgot" is the
            // sharper signal than "keeps grading Hard"
            const reason: "lapsed" | "stuckHard" = lapsedCount > 0 ? "lapsed" : "stuckHard"
            return {
                cardId: row.card_id,
                question: row.question ?? "",
                deckId: row.deck_id,
                deckTitle: row.deck_title ?? "",
                lapseCount: reason === "lapsed" ? lapsedCount : hardCount,
                reason,
            }
        })

        // 7. BEST REVIEW HOUR -- the hour-of-day (VN time) with the best
        // retention, guarded by BEST_HOUR_MIN_SAMPLE so a single lucky review
        // at 3am can't "win".
        const [bestHourRow] = await manager.query<Array<BestHourRow>>(
            `SELECT EXTRACT(HOUR FROM e.reviewed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS hour,
                    COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::text AS recalled,
                    COUNT(*)::text AS total
             ${scopeJoin}
             GROUP BY hour
             HAVING COUNT(*) >= ${BEST_HOUR_MIN_SAMPLE}
             ORDER BY (COUNT(*) FILTER (WHERE e.grade >= ${RECALLED_GRADE})::float / COUNT(*)) DESC,
                      total DESC
             LIMIT 1`,
            [
                enrollmentId,
            ],
        )
        const bestReviewHour: FlashcardBestReviewHourData | null = bestHourRow
            ? {
                hour: bestHourRow.hour,
                retention: this.retentionPercent(bestHourRow.recalled,
                    bestHourRow.total),
            }
            : null

        return {
            leechCards,
            leechFocus,
            weakReviewTag,
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            bestReviewHour,
            deckRetention,
            retentionTrend,
        }
    }

    /** recalled/total as an integer percent 0..100, guarding a zero denominator. */
    private retentionPercent(recalled: string, total: string): number {
        const totalNum = Number(total) || 0
        if (totalNum === 0) {
            return 0
        }
        return Math.round(((Number(recalled) || 0) / totalNum) * 100)
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
