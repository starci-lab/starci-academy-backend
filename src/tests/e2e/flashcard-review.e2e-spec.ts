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
    FlashcardReviewEventEntity,
    Locale,
    PricingPhase,
    PrimaryPostgreSQLModule,
    TranslationResolverService,
    UserEntity,
    UserFlashcardReviewEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    FlashcardCardNotFoundException,
} from "@modules/exceptions"
import {
    CacheService,
} from "@modules/cache"
import {
    FlashcardReviewService,
    UserService,
} from "@modules/bussiness"
import {
    FLAT_POINTS,
} from "@features/api/processors/ai/shared/xp"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** SM-2 grades, mirroring `FlashcardReviewService`'s own vocabulary. */
const GRADE_AGAIN = 0
const GRADE_HARD = 1
const GRADE_GOOD = 2
const GRADE_EASY = 3

/**
 * A valid session UUID threaded onto a graded review. The
 * `flashcard_review_events.session_id` column is `uuid` (it references a real
 * `flashcard_review_sessions.id`), so a non-UUID literal fails to insert.
 */
const TRACKED_SESSION_ID = "8f3b2c1a-4d5e-4f6a-8b7c-9d0e1f2a3b4c"

/**
 * e2e for the flashcard write-flows' grading core --
 * `.claude/canon/be/enforce/authoring/testing.md` §2 names "a flashcard
 * review" explicitly as a write flow that must carry `*.e2e-spec.ts`
 * coverage; this is that coverage for {@link FlashcardReviewService.review}
 * (the SM-2 grade -> schedule commit) and the round-1 premium-answer gate on
 * {@link FlashcardReviewService.listDue}/`listByIds`, run against REAL
 * Postgres (Testcontainers) -- not the mocked-`EntityManager` unit level
 * already covered by `flashcard-review.service.spec.ts`.
 *
 * MOCKED (no external infra available in this harness):
 *  - `CacheService` -- real class talks to Redis; stubbed to always miss so
 *    `UserService.checkEnrollment` (the premium gate's entitlement check)
 *    hits real Postgres every time, never a stale cross-test cache entry.
 *
 * REAL: Postgres (Testcontainers), `FlashcardReviewService` (the grading
 * logic under test), `UserService` (`resolveOrCreateTrialEnrollment` /
 * `checkEnrollment` run real SQL against real `enrollments` rows), and the
 * localization resolver chain (`FlashcardDeckResolverService` ->
 * `FlashcardCardResolverService` -> `TranslationResolverService`, all pure --
 * no external deps) so `listDue`'s premium gate runs exactly as production
 * wires it.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Flashcard review — SM-2 grading + XP grant + premium gate (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let flashcardReviewService: FlashcardReviewService

        /** Read-only fixtures seeded ONCE -- only per-test user/review state is reset. */
        let course: CourseEntity
        let freeCard: FlashcardCardEntity
        let premiumCard: FlashcardCardEntity

        // CacheService always misses -> UserService.checkEnrollment hits real
        // Postgres every time (no stale cross-test cache to reason about).
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers-module/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the SM-2 grading + premium-gate logic under test
                    FlashcardReviewService,
                    // REAL -- pure localization chain, no external deps
                    FlashcardDeckResolverService,
                    FlashcardCardResolverService,
                    TranslationResolverService,
                    // REAL -- resolveOrCreateTrialEnrollment / checkEnrollment run
                    // real SQL against real `enrollments` rows
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            flashcardReviewService = app.get(FlashcardReviewService)

            // seed the read-only course/deck/card fixtures ONCE -- only
            // users/enrollments/review state are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-flashcard-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const deck = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-e2e",
                        description: "e2e fixture deck",
                        difficulty: ChallengeDifficulty.Medium,
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            freeCard = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is dependency injection?",
                        answer: "FREE_ANSWER",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
            premiumCard = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "Explain the NestJS request lifecycle.",
                        answer: "PREMIUM_SECRET_ANSWER",
                        isPremium: true,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
            // Cards are localized on the due path (listDue -> deck resolver -> card
            // resolver): the REQUIRED `question` field always takes its resolved
            // translation value, so a card carrying NO translation row reads back as
            // an empty `front`. Production always seeds one `question` row per locale
            // (the hydration merge emits it) -- mirror that here so `front` resolves to
            // the real prompt instead of "".
            for (const card of [
                freeCard,
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
            // courseId-less "global" flashcard query with cards this suite has no
            // control over (e.g. flashcard-stats-queries.e2e-spec.ts's
            // myDueFlashcards). CASCADE also clears flashcard_cards (+ their
            // translations).
            await entityManager.query(
                "TRUNCATE TABLE \"flashcard_decks\" RESTART IDENTITY CASCADE",
            ).catch(() => undefined)
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/enrollment/review state; course/deck/card
            // fixtures (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"user_flashcard_reviews\", \"flashcard_review_events\", \"xp_histories\" RESTART IDENTITY CASCADE",
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

        /** Seed a REAL, active enrollment (`is_enrolled = true`) for (user, course). */
        const seedEnrollment = async (user: UserEntity): Promise<void> => {
            await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )
        }

        describe("SM-2 scheduling committed to a REAL user_flashcard_reviews row",
            () => {
                it("first-ever grade on a fresh card INSERTS a new row at ease 2.5 / 1-day interval / rep 1, anchored to a trial enrollment",
                    async () => {
                        const user = await seedUser("kc-review-fresh")

                        const result = await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        const review = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        expect(review.ease).toBe(2.5)
                        expect(review.intervalDays).toBe(1)
                        expect(review.repetitions).toBe(1)
                        expect(review.dueAt).toEqual(result.dueAt)

                        // review sessions/queries key by ENROLLMENT -- a trial
                        // enrollment (is_enrolled: false) must have been
                        // resolve-or-created for (user, course) as a side effect
                        const enrollment = await entityManager.findOneOrFail(
                            EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            },
                        )
                        expect(enrollment.isEnrolled).toBe(false)
                        expect(review.enrollmentId).toBe(enrollment.id)
                    })

                it("regrading the SAME card UPDATES the existing row (no second row) and graduates to the fixed 6-day slot at repetition 2",
                    async () => {
                        const user = await seedUser("kc-review-progress")

                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        const count = await entityManager.count(UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                },
                            })
                        expect(count).toBe(1)

                        const review = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        expect(review.repetitions).toBe(2)
                        expect(review.intervalDays).toBe(6)
                    })

                it("multiplies interval by ease from repetition 3 onward (round(prevInterval * ease))",
                    async () => {
                        const user = await seedUser("kc-review-rep3")

                        // rep 1 (1d) -> rep 2 (6d, fixed) -> rep 3 (round(6*2.5)=15d)
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        const review = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        expect(review.repetitions).toBe(3)
                        expect(review.intervalDays).toBe(15)
                        expect(review.ease).toBe(2.5)
                    })

                it("Again (grade 0) resets repetitions to 0 and reschedules 1 day out, leaving ease UNTOUCHED — even with review history",
                    async () => {
                        const user = await seedUser("kc-review-lapse")

                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_EASY,
                        })
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_EASY,
                        })
                        const beforeLapse = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )

                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_AGAIN,
                        })

                        const afterLapse = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        expect(afterLapse.repetitions).toBe(0)
                        expect(afterLapse.intervalDays).toBe(1)
                        expect(afterLapse.ease).toBe(beforeLapse.ease)
                    })

                it("clamps ease at EASE_FLOOR (1.3) on a persisted grade, not just in preview",
                    async () => {
                        const user = await seedUser("kc-review-floor")

                        // repeated Hard grades push ease down toward the floor
                        for (let i = 0; i < 8; i += 1) {
                            await flashcardReviewService.review({
                                userId: user.id,
                                cardId: freeCard.id,
                                grade: GRADE_HARD,
                            })
                        }

                        const review = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        expect(review.ease).toBeGreaterThanOrEqual(1.3)
                    })

                it("throws FlashcardCardNotFoundException for a non-existent card and writes NOTHING",
                    async () => {
                        const user = await seedUser("kc-review-missing-card")

                        await expect(
                            flashcardReviewService.review({
                                userId: user.id,
                                cardId: "11111111-1111-4111-8111-111111111111",
                                grade: GRADE_GOOD,
                            }),
                        ).rejects.toBeInstanceOf(FlashcardCardNotFoundException)

                        const count = await entityManager.count(UserFlashcardReviewEntity)
                        expect(count).toBe(0)
                        const eventCount = await entityManager.count(FlashcardReviewEventEntity)
                        expect(eventCount).toBe(0)
                    })
            })

        describe("XP grant — flat reward on the FIRST review only (real xp_histories + coin_balance)",
            () => {
                it("grants FLASHCARD_FIRST_REVIEW_XP + coin on the very first review of a card",
                    async () => {
                        const user = await seedUser("kc-review-xp-first")

                        const result = await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        expect(result.xpEarned).toBe(2)

                        const review = await entityManager.findOneOrFail(
                            UserFlashcardReviewEntity,
                            {
                                where: {
                                    userId: user.id,
                                    flashcardCard: {
                                        id: freeCard.id,
                                    },
                                },
                            },
                        )
                        const xpHistory = await entityManager.findOneOrFail(
                            XpHistoryEntity,
                            {
                                where: {
                                    // XpHistoryEntity.userId is a bare @RelationId
                                    // (no @Column) -- not queryable in `where`; filter
                                    // through the relation instead
                                    user: {
                                        id: user.id,
                                    },
                                    source: XpSource.FlashcardFirstReview,
                                },
                            },
                        )
                        expect(xpHistory.amount).toBe(2)
                        expect(xpHistory.points).toBe(FLAT_POINTS.flashcardFirstReview)
                        expect(xpHistory.refId).toBe(review.id)

                        const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: user.id,
                                },
                            })
                        expect(reloadedUser.coinBalance).toBe(FLAT_POINTS.flashcardFirstReview)
                    })

                it("grants ZERO XP and writes NO second ledger row on a repeat review of the SAME card",
                    async () => {
                        const user = await seedUser("kc-review-xp-repeat")

                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })
                        const second = await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        expect(second.xpEarned).toBe(0)

                        const xpHistoryCount = await entityManager.count(XpHistoryEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    source: XpSource.FlashcardFirstReview,
                                },
                            })
                        expect(xpHistoryCount).toBe(1)

                        const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: user.id,
                                },
                            })
                        // no second coin credit from the repeat review
                        expect(reloadedUser.coinBalance).toBe(FLAT_POINTS.flashcardFirstReview)
                    })

                it("grading TWO DIFFERENT cards each grants first-review XP once — the gate is per (user, card), not per user",
                    async () => {
                        const user = await seedUser("kc-review-xp-two-cards")

                        const first = await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })
                        // No enrollment is seeded here: `review()` is never gated on
                        // enrollment (only the premium ANSWER reveal in listDue/listByIds
                        // is), and the first grade above already resolve-or-created the
                        // (user, course) trial enrollment both cards share -- a second
                        // `seedEnrollment` would collide on UQ_enrollments_user_course.
                        const second = await flashcardReviewService.review({
                            userId: user.id,
                            cardId: premiumCard.id,
                            grade: GRADE_GOOD,
                        })

                        expect(first.xpEarned).toBe(2)
                        expect(second.xpEarned).toBe(2)

                        const xpHistoryCount = await entityManager.count(XpHistoryEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    source: XpSource.FlashcardFirstReview,
                                },
                            })
                        expect(xpHistoryCount).toBe(2)
                    })
            })

        describe("append-only flashcard_review_events log",
            () => {
                it("appends one event row per grading call, carrying the grade and the caller's sessionId (null when untracked)",
                    async () => {
                        const user = await seedUser("kc-review-events")

                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                            sessionId: TRACKED_SESSION_ID,
                        })
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_HARD,
                        })

                        const events = await entityManager.find(
                            FlashcardReviewEventEntity,
                            {
                                where: {
                                    userId: user.id,
                                },
                                order: {
                                    reviewedAt: "ASC",
                                },
                            },
                        )
                        expect(events).toHaveLength(2)
                        expect(events[0].grade).toBe(GRADE_GOOD)
                        expect(events[0].sessionId).toBe(TRACKED_SESSION_ID)
                        expect(events[1].grade).toBe(GRADE_HARD)
                        expect(events[1].sessionId).toBeNull()
                    })
            })

        describe("round-1 premium content gate — real enrollment check via listDue/listByIds",
            () => {
                it("withholds a premium card's answer for a viewer NOT enrolled in the owning course",
                    async () => {
                        const user = await seedUser("kc-premium-not-enrolled")
                        // no enrollment row created -- never enrolled

                        const result = await flashcardReviewService.listDue({
                            userId: user.id,
                            courseId: course.id,
                            limit: 50,
                            locale: Locale.En,
                        })

                        const card = result.cards.find((c) => c.cardId === premiumCard.id)
                        expect(card).toBeDefined()
                        expect(card?.back).toBe("")
                        // the prompt itself still shows -- only the answer is withheld
                        expect(card?.front).toBe(premiumCard.question)
                    })

                it("reveals a premium card's answer for a viewer actually enrolled (is_enrolled = true)",
                    async () => {
                        const user = await seedUser("kc-premium-enrolled")
                        await seedEnrollment(user)

                        const result = await flashcardReviewService.listDue({
                            userId: user.id,
                            courseId: course.id,
                            limit: 50,
                            locale: Locale.En,
                        })

                        const card = result.cards.find((c) => c.cardId === premiumCard.id)
                        expect(card?.back).toBe("PREMIUM_SECRET_ANSWER")
                    })

                it("never gates a FREE card behind enrollment, regardless of viewer state",
                    async () => {
                        const user = await seedUser("kc-free-not-enrolled")

                        const result = await flashcardReviewService.listDue({
                            userId: user.id,
                            courseId: course.id,
                            limit: 50,
                            locale: Locale.En,
                        })

                        const card = result.cards.find((c) => c.cardId === freeCard.id)
                        expect(card?.back).toBe("FREE_ANSWER")
                    })

                it("a trial (is_enrolled = false) enrollment does NOT satisfy the premium gate — only a REAL paying enrollment does",
                    async () => {
                        const user = await seedUser("kc-premium-trial-only")
                        // grading the free card resolve-or-creates a TRIAL enrollment
                        // (is_enrolled: false) -- this must NOT unlock the premium card
                        await flashcardReviewService.review({
                            userId: user.id,
                            cardId: freeCard.id,
                            grade: GRADE_GOOD,
                        })

                        const result = await flashcardReviewService.listDue({
                            userId: user.id,
                            courseId: course.id,
                            limit: 50,
                            locale: Locale.En,
                        })

                        const card = result.cards.find((c) => c.cardId === premiumCard.id)
                        expect(card?.back).toBe("")
                    })

                it("listByIds mirrors the same gate off the due path (id-based rehydrate)",
                    async () => {
                        const user = await seedUser("kc-premium-listbyids")
                        // no enrollment -- never enrolled

                        const result = await flashcardReviewService.listByIds({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                premiumCard.id,
                                freeCard.id,
                            ],
                            locale: Locale.En,
                        })

                        const premium = result.find((c) => c.cardId === premiumCard.id)
                        const free = result.find((c) => c.cardId === freeCard.id)
                        expect(premium?.back).toBe("")
                        expect(free?.back).toBe("FREE_ANSWER")
                    })
            })
    })
