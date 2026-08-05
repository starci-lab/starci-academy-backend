import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeDifficulty,
    CourseEntity,
    EnrollmentEntity,
    FlashcardCardEntity,
    FlashcardCardResolverService,
    FlashcardCardTranslationEntity,
    FlashcardDeckEntity,
    FlashcardDeckResolverService,
    FlashcardQuizSessionEntity,
    FlashcardReviewEventEntity,
    Locale,
    PricingPhase,
    PrimaryPostgreSQLModule,
    TranslationResolverService,
    UserEntity,
    UserFlashcardReviewEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    KeycloakJwksService,
} from "@modules/keycloak"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import {
    CacheService,
} from "@modules/cache"
import {
    FlashcardDeckReadService,
    FlashcardReviewService,
    UserFlashcardCourseStatsProjectionService,
    UserFlashcardStatsProjectionService,
    UserService,
} from "@modules/bussiness"
import {
    MyDueFlashcardsResolver,
} from "@features/api/core/graphql/queries/flashcard-decks/my-due-flashcards/my-due-flashcards.resolver"
import {
    MyFlashcardStatsResolver,
} from "@features/api/core/graphql/queries/flashcard-decks/my-flashcard-stats/my-flashcard-stats.resolver"
import {
    MyFlashcardReviewStatsResolver,
} from "@features/api/core/graphql/queries/flashcard/my-flashcard-review-stats/my-flashcard-review-stats.resolver"
import {
    MyFlashcardReviewStatsService,
} from "@features/api/core/graphql/queries/flashcard/my-flashcard-review-stats/my-flashcard-review-stats.service"
import {
    MyFlashcardQuizStatsResolver,
} from "@features/api/core/graphql/queries/flashcard/my-flashcard-quiz-stats/my-flashcard-quiz-stats.resolver"
import {
    MyFlashcardQuizStatsService,
} from "@features/api/core/graphql/queries/flashcard/my-flashcard-quiz-stats/my-flashcard-quiz-stats.service"
import {
    FlashcardDecksByCourseResolver,
} from "@features/api/core/graphql/queries/flashcard-decks/flashcard-decks-by-course/flashcard-decks-by-course.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** SM-2 grades, mirroring `FlashcardReviewService`'s own vocabulary. */
const GRADE_AGAIN = 0
const GRADE_GOOD = 2

/**
 * e2e for five previously-untested flashcard READ resolvers --
 * `myDueFlashcards`, `myFlashcardStats`, `myFlashcardReviewStats`,
 * `myFlashcardQuizStats`, `flashcardDecksByCourse`. Every flow here is called
 * by invoking the resolver's `execute()` directly with an already-resolved
 * user (same pattern as `flashcard-review.e2e-spec.ts` /
 * `job-postings.e2e-spec.ts` / `rewards-redeem.e2e-spec.ts` -- the HTTP-level
 * `@UseGuards(KeycloakAuthGraphQLGuard)` is out of scope here, covered once by
 * `progress-query.e2e-spec.ts`'s guard-override pattern).
 *
 * MOCKED (no external infra available in this harness):
 *  - `CacheService` -- real class talks to Redis; stubbed to always miss so
 *    `UserService.resolveOrCreateTrialEnrollment` / `checkEnrollment` hit real
 *    Postgres every time.
 *  - `ElasticsearchService` -- required by `FlashcardDeckReadService`'s
 *    constructor (used only by its single-deck ES-backed read, never by
 *    `listByCourse` under test here); stubbed with no-op methods purely so DI
 *    can resolve the provider graph at `compile()`.
 *
 * REAL: Postgres (Testcontainers), every resolver's own service
 * ({@link FlashcardReviewService}, {@link UserFlashcardStatsProjectionService},
 * {@link MyFlashcardReviewStatsService}, {@link MyFlashcardQuizStatsService},
 * {@link FlashcardDeckReadService}), the shared
 * {@link UserFlashcardCourseStatsProjectionService} CQRS projection (its heavy
 * scan/fold runs for real against real `flashcard_review_events` /
 * `flashcard_quiz_sessions` rows), `UserService`, and the pure localization
 * chain (`FlashcardDeckResolverService` -> `FlashcardCardResolverService` ->
 * `TranslationResolverService`).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Flashcard stats + deck-list query reads (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        let myDueFlashcardsResolver: MyDueFlashcardsResolver
        let myFlashcardStatsResolver: MyFlashcardStatsResolver
        let myFlashcardReviewStatsResolver: MyFlashcardReviewStatsResolver
        let myFlashcardQuizStatsResolver: MyFlashcardQuizStatsResolver
        let flashcardDecksByCourseResolver: FlashcardDecksByCourseResolver

        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        /** Read-only fixtures, seeded once in `beforeAll`. */
        let course: CourseEntity
        let otherCourse: CourseEntity
        let deck: FlashcardDeckEntity
        let cardA: FlashcardCardEntity
        let cardB: FlashcardCardEntity
        let premiumCard: FlashcardCardEntity

        beforeAll(async () => {
            const elasticsearchServiceMock = {
                indicateName: jest.fn(() => "mock-index"),
                client: {
                    search: jest.fn(),
                },
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // myDueFlashcards
                    MyDueFlashcardsResolver,
                    FlashcardReviewService,
                    // myFlashcardStats
                    MyFlashcardStatsResolver,
                    UserFlashcardStatsProjectionService,
                    // myFlashcardReviewStats / myFlashcardQuizStats (shared projection)
                    MyFlashcardReviewStatsResolver,
                    MyFlashcardReviewStatsService,
                    MyFlashcardQuizStatsResolver,
                    MyFlashcardQuizStatsService,
                    UserFlashcardCourseStatsProjectionService,
                    // flashcardDecksByCourse
                    FlashcardDecksByCourseResolver,
                    FlashcardDeckReadService,
                    // REAL -- pure localization chain, no external deps
                    FlashcardDeckResolverService,
                    FlashcardCardResolverService,
                    TranslationResolverService,
                    // REAL -- resolveOrCreateTrialEnrollment / checkEnrollment run real SQL
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    // DI-graph-only stub -- listByCourse never calls this
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchServiceMock,
                    },
                    // KeycloakAuthGraphQLGuard deps -- flashcardDecksByCourse's
                    // `@UseGuards(KeycloakAuthGraphQLGuard)` still needs Nest to
                    // construct the real guard at compile time even though this spec
                    // calls the resolver's `execute()` directly (bypassing the guard
                    // pipeline entirely, same as every other resolver here) -- these
                    // are never invoked (same pattern as jobs-queries.e2e-spec.ts).
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            myDueFlashcardsResolver = app.get(MyDueFlashcardsResolver)
            myFlashcardStatsResolver = app.get(MyFlashcardStatsResolver)
            myFlashcardReviewStatsResolver = app.get(MyFlashcardReviewStatsResolver)
            myFlashcardQuizStatsResolver = app.get(MyFlashcardQuizStatsResolver)
            flashcardDecksByCourseResolver = app.get(FlashcardDecksByCourseResolver)

            // --- read-only course/deck/card fixtures, seeded ONCE ---
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-flashcard-stats-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            otherCourse = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Unrelated Course",
                        displayId: "unrelated-course-flashcard-stats-e2e",
                        description: "e2e fixture course with no decks",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            deck = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-flashcard-stats-e2e",
                        description: "e2e fixture deck",
                        difficulty: ChallengeDifficulty.Medium,
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            cardA = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is dependency injection?",
                        answer: "ANSWER_A",
                        tags: [
                            "NestJS",
                        ],
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
            cardB = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "Explain the NestJS request lifecycle.",
                        answer: "ANSWER_B",
                        tags: [
                            "NestJS",
                        ],
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
            premiumCard = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "Premium: explain custom decorators.",
                        answer: "PREMIUM_ANSWER",
                        explanation: "PREMIUM_EXPLANATION",
                        tags: [
                            "NestJS",
                        ],
                        isPremium: true,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
            // Cards are localized on every read path here (listDue / listByCourse ->
            // deck resolver -> card resolver): the REQUIRED `question` field always
            // takes its resolved translation value, so a card carrying NO translation
            // row reads back as an empty `front`/`question`. Production always seeds
            // one `question` row per locale (the hydration merge emits it) -- mirror
            // that here (same pattern as flashcard-review.e2e-spec.ts) so `question`
            // resolves to the real prompt instead of "".
            for (const card of [
                cardA,
                cardB,
                premiumCard,
            ]) {
                await entityManager.save(
                    entityManager.create(FlashcardCardTranslationEntity,
                        {
                            flashcardCardId: card.id,
                            locale: Locale.En,
                            field: "question",
                            value: card.question,
                        }),
                )
            }
        })

        afterAll(async () => {
            // the deck/card fixtures are read-only WITHIN this suite, but the
            // Testcontainers Postgres is shared across the whole e2e run (see
            // e2e/setup.ts) -- leaving them behind pollutes any OTHER file's
            // courseId-less "global" flashcard query (e.g. myDueFlashcards here
            // itself, run against a DIFFERENT file's leftover cards) with cards
            // this suite has no control over. CASCADE also clears flashcard_cards
            // (+ their translations).
            await entityManager.query(
                "TRUNCATE TABLE \"flashcard_decks\" RESTART IDENTITY CASCADE",
            ).catch(() => undefined)
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // enrollments CASCADE-truncates flashcard_quiz_sessions +
            // user_flashcard_reviews (both FK enrollment_id); flashcard_review_events
            // + user_flashcard_stats_projections + user_flashcard_course_stats_projections
            // are user/enrollment-keyed but not FK-cascaded from enrollments, so they're
            // named explicitly. course/deck/card fixtures (seeded in beforeAll) are
            // read-only across the whole suite.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"flashcard_review_events\", "
                + "\"user_flashcard_reviews\", \"flashcard_quiz_sessions\", "
                + "\"user_flashcard_stats_projections\", \"user_flashcard_course_stats_projections\" "
                + "RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed an enrollment (paid or trial) for a user in the fixture course. */
        const seedEnrollment = async (
            user: UserEntity,
            targetCourse: CourseEntity,
            isEnrolled: boolean,
        ): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course: targetCourse,
                        pricingPhase: isEnrolled ? PricingPhase.Regular : PricingPhase.EarlyBird,
                        isEnrolled,
                    }),
            )

        describe("myDueFlashcards",
            () => {
                it("a never-reviewed card is due; a card scheduled in the future is not",
                    async () => {
                        const user = await seedUser("kc-due-happy")
                        // cardA: reviewed once, scheduled far in the future -- NOT due.
                        // GLOBAL (no courseId) queue keys the review join by user_id,
                        // so no enrollment is needed here.
                        await entityManager.save(
                            entityManager.create(UserFlashcardReviewEntity,
                                {
                                    userId: user.id,
                                    flashcardCard: cardA,
                                    ease: 2.5,
                                    intervalDays: 30,
                                    repetitions: 3,
                                    dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                }),
                        )
                        // cardB: no review row at all -> always due (NEW)
                        // premiumCard also has no review row -- also due

                        const result = await myDueFlashcardsResolver.execute(
                            undefined,
                            10,
                            user,
                            Locale.En,
                        )

                        expect(result.dueCount).toBe(2)
                        const dueIds = result.cards.map((card) => card.cardId)
                        expect(dueIds).toContain(cardB.id)
                        expect(dueIds).toContain(premiumCard.id)
                        expect(dueIds).not.toContain(cardA.id)
                    })

                it("scoped to a course with zero decks: dueCount 0, no cards — never throws",
                    async () => {
                        const user = await seedUser("kc-due-empty-course")

                        const result = await myDueFlashcardsResolver.execute(
                            otherCourse.id,
                            10,
                            user,
                            Locale.En,
                        )

                        expect(result.dueCount).toBe(0)
                        expect(result.cards).toEqual([])
                    })
            })

        describe("myFlashcardStats",
            () => {
                it("computes streak/retention/totals from REAL flashcard_review_events history",
                    async () => {
                        const user = await seedUser("kc-stats-happy")
                        const now = new Date()
                        // 2 recalled (grade>=2) + 1 lapsed, all "today" -> 1-day streak,
                        // retentionRate = 2/3 rounded = 67
                        await entityManager.save([
                            entityManager.create(FlashcardReviewEventEntity,
                                {
                                    userId: user.id,
                                    flashcardCard: cardA,
                                    grade: GRADE_GOOD,
                                    reviewedAt: now,
                                }),
                            entityManager.create(FlashcardReviewEventEntity,
                                {
                                    userId: user.id,
                                    flashcardCard: cardB,
                                    grade: GRADE_GOOD,
                                    reviewedAt: now,
                                }),
                            entityManager.create(FlashcardReviewEventEntity,
                                {
                                    userId: user.id,
                                    flashcardCard: cardA,
                                    grade: GRADE_AGAIN,
                                    reviewedAt: now,
                                }),
                        ])

                        const result = await myFlashcardStatsResolver.execute(user)

                        expect(result.totalReviewed).toBe(3)
                        expect(result.retentionRate).toBe(67)
                        expect(result.currentStreak).toBe(1)
                        expect(result.longestStreak).toBe(1)
                        expect(result.gradeDistribution.good).toBe(2)
                        expect(result.gradeDistribution.again).toBe(1)
                    })

                it("empty state: a user with NO review history gets zeroed stats, not an error",
                    async () => {
                        const user = await seedUser("kc-stats-empty")

                        const result = await myFlashcardStatsResolver.execute(user)

                        expect(result.totalReviewed).toBe(0)
                        expect(result.retentionRate).toBe(0)
                        expect(result.currentStreak).toBe(0)
                        expect(result.lastReviewedAt).toBeNull()
                        expect(result.gradeDistribution).toEqual({
                            again: 0,
                            hard: 0,
                            good: 0,
                            easy: 0,
                        })
                    })
            })

        describe("myFlashcardReviewStats",
            () => {
                it("REAL outcome aggregates: a lapsed leech card drives weakTags/leechFocus/courseRetention",
                    async () => {
                        const user = await seedUser("kc-review-stats-happy")
                        const enrollment = await seedEnrollment(user,
                            course,
                            false)
                        // current SM-2 state for cardA: young material (interval < 21 days)
                        await entityManager.save(
                            entityManager.create(UserFlashcardReviewEntity,
                                {
                                    userId: user.id,
                                    enrollment,
                                    flashcardCard: cardA,
                                    ease: 1.8,
                                    intervalDays: 5,
                                    repetitions: 1,
                                    dueAt: new Date(),
                                }),
                        )
                        // 1 recalled (Good) THEN 4 lapses (Again) on the SAME card -- each
                        // Again has a PRIOR recall in its history, so all 4 count as
                        // "lapsed" (not merely "forgot"); tag sample size (5) clears
                        // WEAK_TAG_MIN_SAMPLE (4); forgot_count (4) clears LEECH_MIN_AGAIN (2)
                        const base = Date.now()
                        const events = [
                            GRADE_GOOD,
                            GRADE_AGAIN,
                            GRADE_AGAIN,
                            GRADE_AGAIN,
                            GRADE_AGAIN,
                        ].map((grade, index) => entityManager.create(FlashcardReviewEventEntity,
                            {
                                userId: user.id,
                                flashcardCard: cardA,
                                grade,
                                reviewedAt: new Date(base + index * 60_000),
                            }))
                        await entityManager.save(events)

                        const result = await myFlashcardReviewStatsResolver.execute(
                            user,
                            course.id,
                        )

                        expect(result.reviewedTotal).toBe(5)
                        // 1 recalled / 5 total = 20%
                        expect(result.courseRetention).toBe(20)
                        expect(result.youngRetention).toBe(20)
                        expect(result.matureRetention).toBe(0)
                        expect(result.weakTags).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    tag: "NestJS",
                                    retention: 20,
                                    cardCount: 1,
                                }),
                            ]),
                        )
                        expect(result.leechFocus).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    cardId: cardA.id,
                                    reason: "lapsed",
                                    lapseCount: 4,
                                }),
                            ]),
                        )
                        expect(result.deckRetention).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    deckId: deck.id,
                                    retention: 20,
                                }),
                            ]),
                        )
                    })

                it("empty state: a fresh trial enrollment with no review events gets zeroed aggregates",
                    async () => {
                        const user = await seedUser("kc-review-stats-empty")
                        // no enrollment pre-seeded -- the service lazily creates a trial one

                        const result = await myFlashcardReviewStatsResolver.execute(
                            user,
                            course.id,
                        )

                        expect(result.reviewedTotal).toBe(0)
                        expect(result.courseRetention).toBe(0)
                        expect(result.weakTags).toEqual([])
                        expect(result.leechFocus).toEqual([])
                        expect(result.deckRetention).toEqual([])
                    })
            })

        describe("myFlashcardQuizStats",
            () => {
                it("3 completed sessions clears MIN_SESSIONS_FOR_STATS: insufficientData=false, real byTag/conceptCoverage",
                    async () => {
                        const user = await seedUser("kc-quiz-stats-happy")
                        const enrollment = await seedEnrollment(user,
                            course,
                            false)
                        const makeSession = () => entityManager.create(FlashcardQuizSessionEntity,
                            {
                                enrollment,
                                cardIds: [
                                    cardA.id,
                                ],
                                status: "completed",
                                results: [
                                    {
                                        cardId: cardA.id,
                                        correctBlanks: 1,
                                        totalBlanks: 2,
                                    },
                                ],
                                level: null,
                                coverage: 0.5,
                            })
                        await entityManager.save([
                            makeSession(),
                            makeSession(),
                            makeSession(),
                        ])

                        const result = await myFlashcardQuizStatsResolver.execute(
                            user,
                            course.id,
                        )

                        expect(result.insufficientData).toBe(false)
                        expect(result.byTag).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    tag: "NestJS",
                                    coverage: 0.5,
                                }),
                            ]),
                        )
                        // the course's decks carry exactly 1 distinct tag ("NestJS"),
                        // and the learner has attempted it
                        expect(result.conceptCoverage).toEqual({
                            covered: 1,
                            total: 1,
                        })
                    })

                it("insufficient data: fewer than MIN_SESSIONS_FOR_STATS completed sessions gates the stats off",
                    async () => {
                        const user = await seedUser("kc-quiz-stats-insufficient")
                        const enrollment = await seedEnrollment(user,
                            course,
                            false)
                        // only 2 completed sessions -- one short of the 3-session floor
                        const makeSession = () => entityManager.create(FlashcardQuizSessionEntity,
                            {
                                enrollment,
                                cardIds: [
                                    cardA.id,
                                ],
                                status: "completed",
                                results: [
                                    {
                                        cardId: cardA.id,
                                        correctBlanks: 2,
                                        totalBlanks: 2,
                                    },
                                ],
                                level: null,
                                coverage: 1,
                            })
                        await entityManager.save([
                            makeSession(),
                            makeSession(),
                        ])

                        const result = await myFlashcardQuizStatsResolver.execute(
                            user,
                            course.id,
                        )

                        expect(result.insufficientData).toBe(true)
                    })
            })

        describe("flashcardDecksByCourse",
            () => {
                it("a PAID-enrolled viewer sees the premium card's full answer/explanation",
                    async () => {
                        const user = await seedUser("kc-decks-entitled")
                        await seedEnrollment(user,
                            course,
                            true)

                        const decks = await flashcardDecksByCourseResolver.execute(
                            course.id,
                            user,
                            Locale.En,
                        )

                        expect(decks).toHaveLength(1)
                        const returnedPremiumCard = decks[0].cards?.find((card) => card.id === premiumCard.id)
                        expect(returnedPremiumCard?.answer).toBe("PREMIUM_ANSWER")
                        expect(returnedPremiumCard?.explanation).toBe("PREMIUM_EXPLANATION")
                    })

                it("insufficient-entitlement: a NON-enrolled viewer gets the premium card's answer/explanation NULLED, question still visible",
                    async () => {
                        const user = await seedUser("kc-decks-not-entitled")
                        // no enrollment at all -- never paid into this course

                        const decks = await flashcardDecksByCourseResolver.execute(
                            course.id,
                            user,
                            Locale.En,
                        )

                        expect(decks).toHaveLength(1)
                        const returnedPremiumCard = decks[0].cards?.find((card) => card.id === premiumCard.id)
                        expect(returnedPremiumCard?.question).toBe("Premium: explain custom decorators.")
                        expect(returnedPremiumCard?.answer).toBeNull()
                        expect(returnedPremiumCard?.explanation).toBeNull()
                        // free cards stay fully visible regardless of entitlement
                        const freeCard = decks[0].cards?.find((card) => card.id === cardA.id)
                        expect(freeCard?.answer).toBe("ANSWER_A")
                    })
            })
    })
