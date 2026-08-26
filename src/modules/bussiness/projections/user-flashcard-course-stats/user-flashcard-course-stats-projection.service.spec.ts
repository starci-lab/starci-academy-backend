import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserFlashcardCourseStatsProjectionService,
} from "./user-flashcard-course-stats-projection.service"
import type {
    UserFlashcardCourseStatsResult,
} from "./types"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    FlashcardReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-session.entity"
import type {
    UserFlashcardCourseStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-course-stats-projection.entity"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
    QueryBuilderMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The enrollment under test -- only ever threaded into params / SQL bindings. */
const ENROLLMENT_ID = "3c8a41d5-6b02-4f7e-9c1a-2d5e8b7f0a63"

/** Default TTL the SUT reads off `envConfig().projection.staleAfterMs` (5 minutes). */
const STALE_AFTER_MS = 5 * 60 * 1000

/** The VN calendar day the forecast anchor query answers with, in every scenario below. */
const VN_TODAY = "2026-03-15"

/** The seven zero-count forecast buckets that follow {@link VN_TODAY}. */
const ZERO_FORECAST = [
    "2026-03-16",
    "2026-03-17",
    "2026-03-18",
    "2026-03-19",
    "2026-03-20",
    "2026-03-21",
    "2026-03-22",
].map((date) => ({
    date,
    count: 0,
}))

/** One raw row of any of the SUT's aggregate queries, as `pg` hands it back. */
type RawRow = Record<string, string | number | null>

/** Every raw-SQL answer one recompute scenario needs, keyed by the aggregate that asks for it. */
interface ScenarioRows {
    /** `COUNT(DISTINCT tag)` over the course's decks (concept coverage denominator). */
    conceptCoverage: Array<RawRow>
    /** Cards already due (`due_at <= now()`). */
    dueToday: Array<RawRow>
    /** Cards due per VN-day inside the forward window. */
    forecast: Array<RawRow>
    /** The VN-calendar anchor the forecast window is enumerated from. */
    vnToday: Array<RawRow>
    /** Reviewed / mastered tally on `user_flashcard_reviews`. */
    mastery: Array<RawRow>
    /** Total cards across the enrollment's course decks. */
    totalCards: Array<RawRow>
    /** The 3-way `interval_days` maturity ladder. */
    ladder: Array<RawRow>
    /** Cards graded Again the most. */
    leech: Array<RawRow>
    /** Per-tag review retention, worst first. */
    tags: Array<RawRow>
    /** Per-deck review retention, worst first. */
    deckRetention: Array<RawRow>
    /** Per-VN-day review retention across the trailing window. */
    trend: Array<RawRow>
    /** The mature-vs-young retention split. */
    maturityRetention: Array<RawRow>
    /** The reason-tagged leech rewrite list. */
    leechFocus: Array<RawRow>
    /** The best-retention hour of day. */
    bestHour: Array<RawRow>
}

/** True when a raw SQL string is this projection's UPSERT. */
const isUpsertSql = (sql: unknown): boolean =>
    String(sql).includes("INSERT INTO user_flashcard_course_stats_projections")

/** A scenario whose every aggregate answers empty, except the always-present VN anchor. */
const emptyRows = (): ScenarioRows => ({
    conceptCoverage: [],
    dueToday: [],
    forecast: [],
    vnToday: [
        {
            today: VN_TODAY,
        },
    ],
    mastery: [],
    totalCards: [],
    ladder: [],
    leech: [],
    tags: [],
    deckRetention: [],
    trend: [],
    maturityRetention: [],
    leechFocus: [],
    bestHour: [],
})

describe("UserFlashcardCourseStatsProjectionService",
    () => {
        let entityManager: EntityManagerMock

        /** Build the SUT wired to a fresh entity-manager mock registered under the primary token. */
        const build = async (): Promise<UserFlashcardCourseStatsProjectionService> => {
            entityManager = makeEntityManagerMock()

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    UserFlashcardCourseStatsProjectionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            return module.get(UserFlashcardCourseStatsProjectionService)
        }

        /**
         * Route every raw aggregate query to its own answer set. The markers are
         * ordered so the broader `FROM flashcard_cards` / `due_at <= now()`
         * fragments cannot swallow a narrower query that also contains them.
         */
        const programQueries = (
            manager: EntityManagerMock,
            rows: ScenarioRows,
        ): void => {
            manager.query.mockImplementation(async (raw: unknown) => {
                const sql = String(raw)
                if (isUpsertSql(sql)) {
                    return []
                }
                if (sql.includes("WITH events AS")) {
                    return rows.leechFocus
                }
                if (sql.includes("EXTRACT(HOUR")) {
                    return rows.bestHour
                }
                if (sql.includes("\"matureRecalled\"")) {
                    return rows.maturityRetention
                }
                if (sql.includes("AS forgot_count")) {
                    return rows.leech
                }
                if (sql.includes("AS card_count")) {
                    return rows.tags
                }
                if (sql.includes("GROUP BY deck.id, deck.title")) {
                    return rows.deckRetention
                }
                if (sql.includes("e.reviewed_at AT TIME ZONE")) {
                    return rows.trend
                }
                if (sql.includes("COUNT(DISTINCT tag.value)")) {
                    return rows.conceptCoverage
                }
                if (sql.includes("due_at > now()")) {
                    return rows.forecast
                }
                if (sql.includes("due_at <= now()")) {
                    return rows.dueToday
                }
                if (sql.includes("AS today")) {
                    return rows.vnToday
                }
                if (sql.includes("\"reviewedTotal\"")) {
                    return rows.mastery
                }
                if (sql.includes("FILTER (WHERE interval_days < 1)")) {
                    return rows.ladder
                }
                return rows.totalCards
            })
        }

        /** Route each entity `find` to the rows that table should answer with. */
        const programFinds = (
            manager: EntityManagerMock,
            quizSessions: Array<unknown>,
            cards: Array<unknown>,
            reviewSessions: Array<unknown>,
        ): void => {
            manager.find.mockImplementation(async (target: unknown) => {
                if (target === FlashcardQuizSessionEntity) {
                    return quizSessions
                }
                if (target === FlashcardCardEntity) {
                    return cards
                }
                if (target === FlashcardReviewSessionEntity) {
                    return reviewSessions
                }
                return []
            })
        }

        /** The shared query-builder the manager mock hands back for the deck-card-count groupBy. */
        const deckCountBuilder = (manager: EntityManagerMock): QueryBuilderMock =>
            manager.createQueryBuilder() as QueryBuilderMock

        /** Read back the aggregate the SUT handed to its UPSERT. */
        const persistedValue = (
            manager: EntityManagerMock,
        ): UserFlashcardCourseStatsResult => {
            const call = manager.query.mock.calls.find(
                (entry: Array<unknown>) => isUpsertSql(entry[0]),
            ) as [unknown, Array<unknown>]
            return JSON.parse(String(call[1][1])) as UserFlashcardCourseStatsResult
        }

        /** Build a projection row carrying the given jsonb value + freshness timestamp. */
        const buildRow = (
            value: Record<string, unknown> | undefined,
            updatedAt: Date,
        ): UserFlashcardCourseStatsProjectionEntity => ({
            enrollmentId: ENROLLMENT_ID,
            value,
            updatedAt,
        } as unknown as UserFlashcardCourseStatsProjectionEntity)

        /** The completed quiz sessions the rich scenario scans, newest-first. */
        const richQuizSessions = (): Array<unknown> => [
            {
                id: "quiz-1",
                updatedAt: new Date("2026-03-04T00:00:00.000Z"),
                coverage: 0.5,
                xpEarned: 10,
                level: "junior",
                results: [
                    {
                        cardId: "card-1",
                        correctBlanks: 1,
                        totalBlanks: 2,
                    },
                    {
                        cardId: "card-2",
                        correctBlanks: 2,
                        totalBlanks: 2,
                    },
                    // this card was deleted since the session ran -- skipped silently
                    {
                        cardId: "card-missing",
                        correctBlanks: 1,
                        totalBlanks: 1,
                    },
                ],
                weakTags: [
                    {
                        tag: "nestjs",
                        coverage: 0.4,
                        moduleId: "module-1",
                        contentId: "content-1",
                    },
                ],
            },
            {
                id: "quiz-2",
                updatedAt: new Date("2026-03-03T00:00:00.000Z"),
                // never snapshotted a coverage -- reads as 0 on the trend line
                coverage: null,
                xpEarned: 5,
                // staff folds into the senior bucket
                level: "staff",
                results: [
                    {
                        cardId: "card-1",
                        correctBlanks: 0,
                        totalBlanks: 2,
                    },
                ],
                weakTags: [
                    // an older occurrence of a tag already recorded -- skipped
                    {
                        tag: "nestjs",
                        coverage: 0.9,
                    },
                    // no module/content mapping -- normalized to null
                    {
                        tag: "redis",
                        coverage: 0.2,
                    },
                ],
            },
            {
                id: "quiz-3",
                updatedAt: new Date("2026-03-02T00:00:00.000Z"),
                coverage: 0.9,
                xpEarned: 0,
                level: "middle",
                results: null,
                weakTags: null,
            },
            {
                id: "quiz-4",
                updatedAt: new Date("2026-03-01T00:00:00.000Z"),
                coverage: 0.7,
                xpEarned: 3,
                level: "senior",
                results: [
                    // a negative blank count clamps to a zero denominator
                    {
                        cardId: "card-3",
                        correctBlanks: 5,
                        totalBlanks: -2,
                    },
                    {
                        cardId: "card-4",
                        correctBlanks: 0,
                        totalBlanks: 3,
                    },
                ],
                weakTags: [],
            },
            {
                id: "quiz-5",
                updatedAt: new Date("2026-02-28T00:00:00.000Z"),
                coverage: 0.3,
                xpEarned: 1,
                // drawn across all levels -- not attributable to one bucket
                level: null,
                results: [
                    {
                        cardId: "card-3",
                        correctBlanks: 0,
                        totalBlanks: 0,
                    },
                    {
                        cardId: "card-4",
                        correctBlanks: 0,
                        totalBlanks: 3,
                    },
                ],
                weakTags: [],
            },
        ]

        /** The cards the rich scenario resolves for the scanned quiz results. */
        const richCards = (): Array<unknown> => [
            {
                id: "card-1",
                question: "Q1",
                tags: [
                    "nestjs",
                    "redis",
                ],
                deckId: "deck-1",
                deck: {
                    id: "deck-1",
                    title: "Deck One",
                },
            },
            {
                id: "card-2",
                question: "Q2",
                tags: [
                    "nestjs",
                ],
                deckId: "deck-4",
                deck: {
                    id: "deck-4",
                    title: "Deck Four",
                },
            },
            // neither the owning deck nor the virtual relation id was resolved,
            // and the question snapshot is blank -- every fallback fires at once
            {
                id: "card-3",
                question: null,
                tags: [],
                deckId: undefined,
                deck: undefined,
            },
            {
                id: "card-4",
                question: "Q4",
                tags: [
                    "redis",
                ],
                deckId: "deck-2",
                deck: {
                    id: "deck-2",
                    title: "Deck Two",
                },
            },
        ]

        /** The completed review sessions the rich scenario scans, newest-first. */
        const richReviewSessions = (): Array<unknown> => [
            {
                id: "review-1",
                deckId: "deck-1",
                reviewedCount: 4,
                deck: {
                    id: "deck-1",
                    title: "Deck One",
                },
            },
            {
                id: "review-2",
                deckId: "deck-1",
                reviewedCount: 6,
                deck: {
                    id: "deck-1",
                    title: "Deck One",
                },
            },
            // no deck relation resolved -- the title falls back to empty
            {
                id: "review-3",
                deckId: "deck-3",
                reviewedCount: 2,
                deck: null,
            },
        ]

        /** Every raw aggregate answer the rich scenario needs. */
        const richRows = (): ScenarioRows => ({
            conceptCoverage: [
                {
                    total: "8",
                },
            ],
            dueToday: [
                {
                    count: "7",
                },
            ],
            forecast: [
                {
                    day: "2026-03-16",
                    count: "3",
                },
                // an unparseable count reads as zero rather than NaN
                {
                    day: "2026-03-18",
                    count: "oops",
                },
            ],
            vnToday: [
                {
                    today: VN_TODAY,
                },
            ],
            mastery: [
                {
                    reviewedTotal: "20",
                    mastered: "8",
                },
            ],
            totalCards: [
                {
                    total: "30",
                },
            ],
            ladder: [
                {
                    learning: "5",
                    young: "9",
                    mature: "6",
                },
            ],
            leech: [
                {
                    card_id: "card-1",
                    question: "Q1",
                    forgot_count: "4",
                    deck_id: "deck-1",
                    deck_title: "Deck One",
                },
                {
                    card_id: "card-9",
                    question: null,
                    forgot_count: "x",
                    deck_id: "deck-2",
                    deck_title: null,
                },
            ],
            tags: [
                // an unparseable review total zeroes both the retention and the sample size
                {
                    tag: "kafka",
                    recalled: "1",
                    total: "n/a",
                    card_count: "2",
                },
                {
                    tag: "redis",
                    recalled: "2",
                    total: "10",
                    card_count: "3",
                },
                {
                    tag: "nestjs",
                    recalled: "7",
                    total: "8",
                    card_count: "nope",
                },
            ],
            deckRetention: [
                {
                    deck_id: "deck-1",
                    deck_title: "Deck One",
                    recalled: "3",
                    total: "10",
                },
                {
                    deck_id: "deck-2",
                    deck_title: null,
                    recalled: "9",
                    total: "bad",
                },
            ],
            trend: [
                {
                    day: "2026-03-13",
                    recalled: "1",
                    total: "zz",
                },
                {
                    day: "2026-03-14",
                    recalled: "z",
                    total: "4",
                },
                {
                    day: "2026-03-15",
                    recalled: "3",
                    total: "4",
                },
            ],
            maturityRetention: [
                {
                    matureRecalled: "8",
                    matureTotal: "10",
                    youngRecalled: "5",
                    youngTotal: "20",
                },
            ],
            leechFocus: [
                {
                    card_id: "card-1",
                    question: "Q1",
                    deck_id: "deck-1",
                    deck_title: "Deck One",
                    lapsed_count: "3",
                    hard_count: "1",
                },
                {
                    card_id: "card-2",
                    question: null,
                    deck_id: "deck-2",
                    deck_title: null,
                    lapsed_count: "0",
                    hard_count: "4",
                },
                {
                    card_id: "card-5",
                    question: "Q5",
                    deck_id: "deck-2",
                    deck_title: "Deck Two",
                    lapsed_count: "nope",
                    hard_count: "nope",
                },
            ],
            bestHour: [
                {
                    hour: 21,
                    recalled: "9",
                    total: "10",
                },
            ],
        })

        /** Wire the whole rich scenario onto the injected manager and run one recompute. */
        const runRichRecompute = async (
            service: UserFlashcardCourseStatsProjectionService,
        ): Promise<UserFlashcardCourseStatsResult> => {
            programQueries(entityManager,
                richRows())
            programFinds(entityManager,
                richQuizSessions(),
                richCards(),
                richReviewSessions())
            deckCountBuilder(entityManager).getRawMany
                // the quiz-side groupBy answers a real total for deck-1 and an
                // unparseable one for deck-4; deck-2 is missing from the result set
                .mockResolvedValueOnce([
                    {
                        deckId: "deck-1",
                        total: "12",
                    },
                    {
                        deckId: "deck-4",
                        total: "bogus",
                    },
                ])
                // the review-side groupBy returns an unparseable total for deck-1
                // and no row at all for deck-3
                .mockResolvedValueOnce([
                    {
                        deckId: "deck-1",
                        total: "nope",
                    },
                ])

            await service.recompute({
                enrollmentId: ENROLLMENT_ID,
            })
            return persistedValue(entityManager)
        }

        describe("recompute -- plumbing",
            () => {
                it("upserts the aggregate on the injected connection, keyed by enrollment",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const call = entityManager.query.mock.calls.find(
                            (entry: Array<unknown>) => isUpsertSql(entry[0]),
                        ) as [unknown, Array<unknown>]
                        expect(call[1][0]).toBe(ENROLLMENT_ID)
                        expect(entityManager.find).toHaveBeenCalledWith(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    enrollment: {
                                        id: ENROLLMENT_ID,
                                    },
                                    status: "completed",
                                },
                                order: {
                                    updatedAt: "DESC",
                                },
                                take: 50,
                            },
                        )
                    })

                it("honours the caller's transaction manager instead of the injected connection",
                    async () => {
                        const service = await build()
                        const txManager = makeEntityManagerMock()
                        programQueries(txManager,
                            emptyRows())

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                            entityManager: txManager as unknown as EntityManager,
                        })

                        expect(txManager.query.mock.calls.some(
                            (entry: Array<unknown>) => isUpsertSql(entry[0]),
                        )).toBe(true)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })

                it("propagates a failure raised by the quiz-session scan",
                    async () => {
                        const service = await build()
                        const dbError = new Error("connection lost")
                        entityManager.find.mockRejectedValueOnce(dbError)

                        await expect(service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })).rejects.toThrow(dbError)
                    })
            })

        describe("recompute -- an enrollment with no history at all",
            () => {
                it("persists a fully zeroed aggregate with a zero-filled forward forecast",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager)).toEqual({
                            quizTrend: [],
                            quizByTag: [],
                            quizByDeck: [],
                            weakTagLinks: [],
                            quizHardCards: [],
                            completedSessionCount: 0,
                            difficultyMix: {
                                junior: 0,
                                middle: 0,
                                senior: 0,
                            },
                            // the course itself has no tag data to compare against
                            conceptCoverage: null,
                            reviewByDeck: [],
                            dueToday: 0,
                            dueForecast: ZERO_FORECAST,
                            masteryBreakdown: {
                                mastered: 0,
                                learning: 0,
                                new: 0,
                            },
                            maturityLadder: {
                                learning: 0,
                                young: 0,
                                mature: 0,
                            },
                            forgetSoon: {
                                count: 0,
                                horizonDays: 7,
                                byDay: ZERO_FORECAST,
                            },
                            leechCards: [],
                            leechFocus: [],
                            weakReviewTag: null,
                            weakTags: [],
                            matureRetention: 0,
                            youngRetention: 0,
                            reviewedTotal: 0,
                            courseRetention: 0,
                            bestReviewHour: null,
                            deckRetention: [],
                            retentionTrend: [],
                        })
                        // nothing to group by -- the deck-count groupBy never runs
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("still counts scanned sessions and their difficulty mix when none recorded a card result",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())
                        programFinds(
                            entityManager,
                            [
                                {
                                    id: "quiz-a",
                                    updatedAt: new Date("2026-03-04T00:00:00.000Z"),
                                    coverage: 0.4,
                                    xpEarned: 2,
                                    level: "junior",
                                    results: [],
                                    weakTags: [],
                                },
                                {
                                    id: "quiz-b",
                                    updatedAt: new Date("2026-03-03T00:00:00.000Z"),
                                    coverage: 0.8,
                                    xpEarned: 4,
                                    level: "middle",
                                    results: null,
                                    weakTags: [],
                                },
                            ],
                            [],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.completedSessionCount).toBe(2)
                        expect(value.difficultyMix).toEqual({
                            junior: 1,
                            middle: 1,
                            senior: 0,
                        })
                        expect(value.quizTrend).toHaveLength(2)
                        // no card ids were referenced -- the card lookup is skipped entirely
                        expect(entityManager.find).not.toHaveBeenCalledWith(
                            FlashcardCardEntity,
                            expect.anything(),
                        )
                        expect(value.quizByTag).toEqual([])
                        expect(value.quizByDeck).toEqual([])
                        expect(value.quizHardCards).toEqual([])
                    })

                it("returns no deck breakdown when every answered card's deck is unresolved",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())
                        programFinds(
                            entityManager,
                            [
                                {
                                    id: "quiz-a",
                                    updatedAt: new Date("2026-03-04T00:00:00.000Z"),
                                    coverage: 0.4,
                                    xpEarned: 2,
                                    level: "junior",
                                    results: [
                                        {
                                            cardId: "card-3",
                                            correctBlanks: 1,
                                            totalBlanks: 2,
                                        },
                                    ],
                                    weakTags: [],
                                },
                            ],
                            [
                                {
                                    id: "card-3",
                                    question: "Q3",
                                    tags: [
                                        "redis",
                                    ],
                                    deckId: "deck-2",
                                    deck: undefined,
                                },
                            ],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager).quizByDeck).toEqual([])
                        // no deck ids survived, so the card-count groupBy is never issued
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })
            })

        describe("recompute -- the quiz fold",
            () => {
                it("builds the trend oldest-of-the-window first, reading an unsnapshotted coverage as 0",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.completedSessionCount).toBe(5)
                        expect(value.quizTrend).toEqual([
                            {
                                completedAt: "2026-02-28T00:00:00.000Z",
                                coverage: 0.3,
                                xpEarned: 1,
                            },
                            {
                                completedAt: "2026-03-01T00:00:00.000Z",
                                coverage: 0.7,
                                xpEarned: 3,
                            },
                            {
                                completedAt: "2026-03-02T00:00:00.000Z",
                                coverage: 0.9,
                                xpEarned: 0,
                            },
                            {
                                completedAt: "2026-03-03T00:00:00.000Z",
                                coverage: 0,
                                xpEarned: 5,
                            },
                            {
                                completedAt: "2026-03-04T00:00:00.000Z",
                                coverage: 0.5,
                                xpEarned: 10,
                            },
                        ])
                    })

                it("folds staff sessions into senior and drops the all-levels draw from the mix",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.difficultyMix).toEqual({
                            junior: 1,
                            middle: 1,
                            senior: 2,
                        })
                    })

                it("ranks tag coverage descending, skipping results whose card no longer exists",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.quizByTag).toEqual([
                            {
                                tag: "nestjs",
                                coverage: 0.5,
                            },
                            {
                                tag: "redis",
                                coverage: 0.125,
                            },
                        ])
                    })

                it("keeps only each weak tag's most recent occurrence, weakest first",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.weakTagLinks).toEqual([
                            {
                                tag: "redis",
                                coverage: 0.2,
                                moduleId: null,
                                contentId: null,
                            },
                            {
                                tag: "nestjs",
                                // 0.4 is quiz-1's snapshot; quiz-2's older 0.9 is discarded
                                coverage: 0.4,
                                moduleId: "module-1",
                                contentId: "content-1",
                            },
                        ])
                    })

                it("counts a deck answered in two sessions twice, and defaults an unresolved card total to 0",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.quizByDeck).toEqual([
                            {
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                                sessionCount: 2,
                                cardsAnswered: 2,
                                totalCards: 12,
                            },
                            {
                                // the groupBy answered an unparseable total for this deck
                                deckId: "deck-4",
                                deckTitle: "Deck Four",
                                sessionCount: 1,
                                cardsAnswered: 1,
                                totalCards: 0,
                            },
                            {
                                // the groupBy answered no row at all for this deck
                                deckId: "deck-2",
                                deckTitle: "Deck Two",
                                sessionCount: 2,
                                cardsAnswered: 2,
                                totalCards: 0,
                            },
                        ])
                    })

                it("ranks frequently-missed cards by coverage then wrong count, dropping one-off misses",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.quizHardCards).toEqual([
                            {
                                cardId: "card-4",
                                question: "Q4",
                                attempts: 2,
                                wrongCount: 2,
                                coverage: 0,
                                deckId: "deck-2",
                                deckTitle: "Deck Two",
                            },
                            {
                                // a clamped zero denominator reads as zero coverage, and a
                                // card with no question, deck id or deck relation resolved
                                // falls back to empty strings rather than undefined
                                cardId: "card-3",
                                question: "",
                                attempts: 2,
                                wrongCount: 0,
                                coverage: 0,
                                deckId: "",
                                deckTitle: "",
                            },
                            {
                                cardId: "card-1",
                                question: "Q1",
                                attempts: 2,
                                wrongCount: 2,
                                coverage: 0.25,
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                            },
                        ])
                    })

                it("reports concept coverage as tags attempted over tags the course owns",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.conceptCoverage).toEqual({
                            covered: 2,
                            total: 8,
                        })
                    })
            })

        describe("recompute -- the review fold",
            () => {
                it("aggregates completed review sessions per deck, defaulting an unresolved title and total",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.reviewByDeck).toEqual([
                            {
                                // the groupBy answered an unparseable total for this deck
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                                sessionCount: 2,
                                cardsReviewed: 10,
                                totalCards: 0,
                            },
                            {
                                // no deck relation resolved and no groupBy row either
                                deckId: "deck-3",
                                deckTitle: "",
                                sessionCount: 1,
                                cardsReviewed: 2,
                                totalCards: 0,
                            },
                        ])
                    })
            })

        describe("recompute -- the due and mastery fold",
            () => {
                it("zero-fills the seven-day forecast and sums the leading days into the forget-soon headline",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.dueToday).toBe(7)
                        expect(value.dueForecast).toEqual([
                            {
                                date: "2026-03-16",
                                count: 3,
                            },
                            {
                                date: "2026-03-17",
                                count: 0,
                            },
                            {
                                date: "2026-03-18",
                                count: 0,
                            },
                            {
                                date: "2026-03-19",
                                count: 0,
                            },
                            {
                                date: "2026-03-20",
                                count: 0,
                            },
                            {
                                date: "2026-03-21",
                                count: 0,
                            },
                            {
                                date: "2026-03-22",
                                count: 0,
                            },
                        ])
                        expect(value.forgetSoon).toEqual({
                            count: 3,
                            horizonDays: 7,
                            byDay: value.dueForecast,
                        })
                    })

                it("folds never-reviewed course cards into both the mastery breakdown and the ladder",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.masteryBreakdown).toEqual({
                            mastered: 8,
                            learning: 12,
                            new: 10,
                        })
                        expect(value.maturityLadder).toEqual({
                            // 5 below a one-day interval plus the 10 never reviewed
                            learning: 15,
                            young: 9,
                            mature: 6,
                        })
                    })
            })

        describe("recompute -- the review-outcome fold",
            () => {
                it("maps leech cards, defaulting a null question and deck title",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.leechCards).toEqual([
                            {
                                cardId: "card-1",
                                question: "Q1",
                                forgotCount: 4,
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                            },
                            {
                                cardId: "card-9",
                                question: "",
                                forgotCount: 0,
                                deckId: "deck-2",
                                deckTitle: "",
                            },
                        ])
                    })

                it("exposes the whole tag ranking and takes the weakest tag off its head",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.weakTags).toEqual([
                            {
                                tag: "kafka",
                                retention: 0,
                                cardCount: 2,
                            },
                            {
                                tag: "redis",
                                retention: 20,
                                cardCount: 3,
                            },
                            {
                                // 7 of 8 rounds up to 88
                                tag: "nestjs",
                                retention: 88,
                                cardCount: 0,
                            },
                        ])
                        // the weakest tag is the ranking's head, not a second query
                        expect(value.weakReviewTag).toEqual({
                            tag: "kafka",
                            retention: 0,
                            reviewCount: 0,
                        })
                    })

                it("reports zero retention for a deck whose review total cannot be parsed",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.deckRetention).toEqual([
                            {
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                                retention: 30,
                                reviewCount: 10,
                            },
                            {
                                deckId: "deck-2",
                                deckTitle: "",
                                retention: 0,
                                reviewCount: 0,
                            },
                        ])
                    })

                it("maps the per-day retention trend, reading an unparseable recalled count as zero",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.retentionTrend).toEqual([
                            {
                                // an unparseable total zeroes both the retention and the sample
                                date: "2026-03-13",
                                retention: 0,
                                reviewCount: 0,
                            },
                            {
                                date: "2026-03-14",
                                retention: 0,
                                reviewCount: 4,
                            },
                            {
                                date: "2026-03-15",
                                retention: 75,
                                reviewCount: 4,
                            },
                        ])
                    })

                it("splits mature from young retention and derives the course-scoped totals from the same scan",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.matureRetention).toBe(80)
                        expect(value.youngRetention).toBe(25)
                        expect(value.reviewedTotal).toBe(30)
                        // (8 + 5) recalled out of (10 + 20) graded
                        expect(value.courseRetention).toBe(43)
                    })

                it("tags each leech-focus card with the reason that fits, preferring a lapse over stuck-hard",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.leechFocus).toEqual([
                            {
                                cardId: "card-1",
                                question: "Q1",
                                deckId: "deck-1",
                                deckTitle: "Deck One",
                                lapseCount: 3,
                                reason: "lapsed",
                            },
                            {
                                cardId: "card-2",
                                question: "",
                                deckId: "deck-2",
                                deckTitle: "",
                                lapseCount: 4,
                                reason: "stuckHard",
                            },
                            {
                                cardId: "card-5",
                                question: "Q5",
                                deckId: "deck-2",
                                deckTitle: "Deck Two",
                                lapseCount: 0,
                                reason: "stuckHard",
                            },
                        ])
                    })

                it("names the best review hour when one clears the sample floor",
                    async () => {
                        const service = await build()

                        const value = await runRichRecompute(service)

                        expect(value.bestReviewHour).toEqual({
                            hour: 21,
                            retention: 90,
                        })
                    })
            })

        describe("getStats",
            () => {
                /** A stored jsonb value carrying every key the read path checks for drift. */
                const completeStoredValue = (): Record<string, unknown> => ({
                    quizTrend: [],
                    quizByTag: [],
                    quizByDeck: [],
                    weakTagLinks: [],
                    quizHardCards: [],
                    completedSessionCount: 4,
                    difficultyMix: {
                        junior: 1,
                        middle: 2,
                        senior: 1,
                    },
                    conceptCoverage: {
                        covered: 2,
                        total: 8,
                    },
                    reviewByDeck: [],
                    dueToday: 7,
                    dueForecast: [],
                    masteryBreakdown: {
                        mastered: 8,
                        learning: 12,
                        new: 10,
                    },
                    maturityLadder: {
                        learning: 15,
                        young: 9,
                        mature: 6,
                    },
                    forgetSoon: {
                        count: 3,
                        horizonDays: 7,
                        byDay: [],
                    },
                    leechCards: [],
                    leechFocus: [],
                    weakReviewTag: null,
                    weakTags: [],
                    matureRetention: 80,
                    youngRetention: 25,
                    reviewedTotal: 30,
                    courseRetention: 43,
                    bestReviewHour: null,
                    deckRetention: [],
                    retentionTrend: [],
                })

                it("returns a fresh, complete row without recomputing",
                    async () => {
                        const service = await build()
                        const stored = completeStoredValue()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            stored,
                            new Date(),
                        ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(result).toEqual(stored)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.findOne).toHaveBeenCalledTimes(1)
                    })

                it("lazily recomputes a row past the staleness TTL, then re-reads it",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())
                        const refreshed = completeStoredValue()
                        refreshed.dueToday = 99
                        entityManager.findOne
                            .mockResolvedValueOnce(buildRow(
                                completeStoredValue(),
                                new Date(Date.now() - STALE_AFTER_MS - 1_000),
                            ))
                            .mockResolvedValueOnce(buildRow(
                                refreshed,
                                new Date(),
                            ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result.dueToday).toBe(99)
                    })

                it("recomputes a missing row and falls back to the zeroed shape when still absent",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result).toEqual({
                            quizTrend: [],
                            quizByTag: [],
                            quizByDeck: [],
                            weakTagLinks: [],
                            quizHardCards: [],
                            completedSessionCount: 0,
                            difficultyMix: {
                                junior: 0,
                                middle: 0,
                                senior: 0,
                            },
                            conceptCoverage: null,
                            reviewByDeck: [],
                            dueToday: 0,
                            dueForecast: [],
                            masteryBreakdown: {
                                mastered: 0,
                                learning: 0,
                                new: 0,
                            },
                            maturityLadder: {
                                learning: 0,
                                young: 0,
                                mature: 0,
                            },
                            forgetSoon: {
                                count: 0,
                                horizonDays: 7,
                                byDay: [],
                            },
                            leechCards: [],
                            leechFocus: [],
                            weakReviewTag: null,
                            weakTags: [],
                            matureRetention: 0,
                            youngRetention: 0,
                            reviewedTotal: 0,
                            courseRetention: 0,
                            bestReviewHour: null,
                            deckRetention: [],
                            retentionTrend: [],
                        })
                    })

                it.each([
                    "leechCards",
                    "quizHardCards",
                    "maturityLadder",
                    "reviewedTotal",
                ])("recomputes a fresh row that predates the %s field",
                    async (missingKey: string) => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())
                        const drifted = completeStoredValue()
                        delete drifted[missingKey]
                        entityManager.findOne
                            .mockResolvedValueOnce(buildRow(
                                drifted,
                                new Date(),
                            ))
                            .mockResolvedValueOnce(buildRow(
                                completeStoredValue(),
                                new Date(),
                            ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(entityManager.query.mock.calls.some(
                            (entry: Array<unknown>) => isUpsertSql(entry[0]),
                        )).toBe(true)
                        expect(result.completedSessionCount).toBe(4)
                    })

                it("recomputes a fresh row whose jsonb value is absent entirely",
                    async () => {
                        const service = await build()
                        programQueries(entityManager,
                            emptyRows())
                        entityManager.findOne
                            .mockResolvedValueOnce(buildRow(
                                undefined,
                                new Date(),
                            ))
                            .mockResolvedValueOnce(buildRow(
                                completeStoredValue(),
                                new Date(),
                            ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result.reviewedTotal).toBe(30)
                    })

                it("propagates a findOne failure while reading the projection row",
                    async () => {
                        const service = await build()
                        const dbError = new Error("read replica unavailable")
                        entityManager.findOne.mockRejectedValueOnce(dbError)

                        await expect(service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })).rejects.toThrow(dbError)
                    })

                it("propagates a recompute failure triggered by the lazy refresh",
                    async () => {
                        const service = await build()
                        const dbError = new Error("upsert failed")
                        entityManager.query.mockRejectedValueOnce(dbError)

                        await expect(service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })).rejects.toThrow(dbError)
                    })

                it("returns safe retention percentages for zero and complete totals",
                    async () => {
                        const service = await build()
                        const methods = service as unknown as {
                            retentionPercent: (recalled: string, total: string) => number
                        }
                        expect(methods.retentionPercent("0",
                            "0")).toBe(0)
                        expect(methods.retentionPercent("3",
                            "4")).toBe(75)
                        expect(methods.retentionPercent("bad",
                            "4")).toBe(0)
                    })
            })
    })
