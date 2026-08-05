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
    FlashcardDeckEntity,
    FlashcardReviewSessionEntity,
    Locale,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
    UserFlashcardReviewEntity,
} from "@modules/databases"
import {
    FlashcardDeckNotFoundException,
} from "@modules/exceptions"
import {
    CacheService,
} from "@modules/cache"
import {
    FlashcardReviewSessionService,
    UserService,
} from "@modules/bussiness"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the resumable flashcard REVIEW session bookkeeping
 * wrapper -- `.claude/canon/be/enforce/authoring/testing.md` §2 names "a
 * flashcard review" as a write flow that must carry `*.e2e-spec.ts` coverage;
 * this is that coverage for {@link FlashcardReviewSessionService}'s
 * start -> sync -> complete lifecycle (per-deck resumable draw), run against
 * REAL Postgres (Testcontainers) -- the actual SM-2 grading is covered
 * separately by `flashcard-review.e2e-spec.ts`, this file only proves the
 * session-row bookkeeping around it: the "abandon prior in_progress draw"
 * race-guard, the `Not("completed")` completion guard (the documented
 * 2026-07-12 stuck-session fix), and the "due" mode's dueAt-based card filter.
 *
 * MOCKED (no external infra available in this harness):
 *  - `CacheService` -- real class talks to Redis; stubbed to always miss so
 *    `UserService.resolveOrCreateTrialEnrollment` hits real Postgres every
 *    time, never a stale cross-test cache entry.
 *
 * REAL: Postgres (Testcontainers), `FlashcardReviewSessionService` (the
 * service under test), `UserService` (`resolveOrCreateTrialEnrollment` runs
 * real SQL against real `enrollments` rows).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Flashcard review session — start/sync/complete lifecycle (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let sessionService: FlashcardReviewSessionService

        /** Read-only fixtures seeded ONCE -- only per-test user/session state is reset. */
        let course: CourseEntity
        let deck: FlashcardDeckEntity
        let cardA: FlashcardCardEntity
        let cardB: FlashcardCardEntity

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
                    // REAL -- the session start/sync/complete/find logic under test
                    FlashcardReviewSessionService,
                    // REAL -- resolveOrCreateTrialEnrollment runs real SQL against
                    // real `enrollments` rows
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
            sessionService = app.get(FlashcardReviewSessionService)

            // seed the read-only course/deck/card fixtures ONCE -- only
            // users/enrollments/session/review state are reset between tests
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-review-session-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            deck = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-review-session-e2e",
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
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            )
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
            // reset per-test user/enrollment/session/review state; course/deck/card
            // fixtures (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"flashcard_review_sessions\", \"user_flashcard_reviews\" RESTART IDENTITY CASCADE",
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

        describe("start — persists a resumable draw anchored to a trial enrollment",
            () => {
                it("persists a fresh in_progress session with the full cardIds set, currentIndex 0, anchored to a trial (is_enrolled=false) enrollment",
                    async () => {
                        const user = await seedUser("kc-start-fresh")

                        const result = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: result.sessionId,
                                },
                            },
                        )
                        expect(session.status).toBe("in_progress")
                        expect(session.cardIds).toEqual([
                            cardA.id,
                            cardB.id,
                        ])
                        expect(session.currentIndex).toBe(0)
                        expect(session.reviewedCount).toBe(0)
                        expect(session.gradedIndexes).toEqual([])
                        expect(session.xpEarned).toBe(0)

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
                        expect(session.enrollmentId).toBe(enrollment.id)
                    })

                it("mode='due' narrows cardIds to only never-reviewed or overdue cards",
                    async () => {
                        const user = await seedUser("kc-start-due-narrow")
                        const enrollment = await entityManager.save(
                            entityManager.create(EnrollmentEntity,
                                {
                                    user,
                                    course,
                                    pricingPhase: PricingPhase.Regular,
                                    isEnrolled: true,
                                }),
                        )
                        // cardA is scheduled far in the future (NOT due); cardB has no
                        // review row at all (never reviewed -> always due)
                        await entityManager.save(
                            entityManager.create(UserFlashcardReviewEntity,
                                {
                                    userId: user.id,
                                    enrollment,
                                    flashcardCard: cardA,
                                    ease: 2.5,
                                    intervalDays: 30,
                                    repetitions: 3,
                                    dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                }),
                        )

                        const result = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                            mode: "due",
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: result.sessionId,
                                },
                            },
                        )
                        expect(session.cardIds).toEqual([
                            cardB.id,
                        ])
                    })

                it("mode='due' falls back to the FULL set rather than persisting an empty draw when nothing is due",
                    async () => {
                        const user = await seedUser("kc-start-due-empty-fallback")
                        const enrollment = await entityManager.save(
                            entityManager.create(EnrollmentEntity,
                                {
                                    user,
                                    course,
                                    pricingPhase: PricingPhase.Regular,
                                    isEnrolled: true,
                                }),
                        )
                        // BOTH cards scheduled far in the future -- nothing is due
                        for (const card of [
                            cardA,
                            cardB,
                        ]) {
                            await entityManager.save(
                                entityManager.create(UserFlashcardReviewEntity,
                                    {
                                        userId: user.id,
                                        enrollment,
                                        flashcardCard: card,
                                        ease: 2.5,
                                        intervalDays: 30,
                                        repetitions: 3,
                                        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                    }),
                            )
                        }

                        const result = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                            mode: "due",
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: result.sessionId,
                                },
                            },
                        )
                        expect(session.cardIds).toEqual([
                            cardA.id,
                            cardB.id,
                        ])
                    })

                it("starting a SECOND draw for the same (enrollment, deck) abandons the prior in_progress row — never two resumable drafts at once",
                    async () => {
                        const user = await seedUser("kc-start-retire-prior")

                        const first = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        const second = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const firstRow = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: first.sessionId,
                                },
                            },
                        )
                        expect(firstRow.status).toBe("abandoned")

                        const secondRow = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: second.sessionId,
                                },
                            },
                        )
                        expect(secondRow.status).toBe("in_progress")

                        const inProgressCount = await entityManager.count(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    status: "in_progress",
                                },
                            },
                        )
                        expect(inProgressCount).toBe(1)
                    })

                it("throws FlashcardDeckNotFoundException for a non-existent deck and writes NOTHING",
                    async () => {
                        const user = await seedUser("kc-start-missing-deck")

                        await expect(
                            sessionService.start({
                                userId: user.id,
                                deckId: "11111111-1111-4111-8111-111111111111",
                                cardIds: [
                                    cardA.id,
                                ],
                            }),
                        ).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)

                        const count = await entityManager.count(FlashcardReviewSessionEntity)
                        expect(count).toBe(0)
                    })
            })

        describe("sync — ownership-scoped, silent no-op instead of throwing",
            () => {
                it("applies currentIndex/reviewedCount/gradedIndexes/xpEarned to an owned in_progress session",
                    async () => {
                        const user = await seedUser("kc-sync-applies")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const result = await sessionService.sync({
                            userId: user.id,
                            sessionId: started.sessionId,
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 0,
                        })

                        expect(result.success).toBe(true)
                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(1)
                        expect(session.reviewedCount).toBe(1)
                        expect(session.gradedIndexes).toEqual([
                            0,
                        ])
                    })

                it("omitting gradedIndexes leaves the previously-synced set UNTOUCHED",
                    async () => {
                        const user = await seedUser("kc-sync-omit-graded")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })
                        await sessionService.sync({
                            userId: user.id,
                            sessionId: started.sessionId,
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 0,
                        })

                        await sessionService.sync({
                            userId: user.id,
                            sessionId: started.sessionId,
                            currentIndex: 2,
                            reviewedCount: 2,
                            xpEarned: 0,
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(2)
                        // gradedIndexes column untouched by the omitting call
                        expect(session.gradedIndexes).toEqual([
                            0,
                        ])
                    })

                it("no-ops (returns success: false, mutates nothing) for a session owned by a DIFFERENT user",
                    async () => {
                        const owner = await seedUser("kc-sync-owner")
                        const intruder = await seedUser("kc-sync-intruder")
                        const started = await sessionService.start({
                            userId: owner.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })

                        const result = await sessionService.sync({
                            userId: intruder.id,
                            sessionId: started.sessionId,
                            currentIndex: 5,
                            reviewedCount: 5,
                            xpEarned: 99,
                        })

                        expect(result.success).toBe(false)
                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(0)
                        expect(session.xpEarned).toBe(0)
                    })

                it("no-ops for a session that is no longer in_progress (already completed)",
                    async () => {
                        const user = await seedUser("kc-sync-completed")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        const result = await sessionService.sync({
                            userId: user.id,
                            sessionId: started.sessionId,
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        expect(result.success).toBe(false)
                    })
            })

        describe("complete — snapshot + replay-safe, tolerant of a raced 'abandoned' status",
            () => {
                it("flips status to completed and snapshots reviewedCount/xpEarned",
                    async () => {
                        const user = await seedUser("kc-complete-basic")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const result = await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 2,
                            xpEarned: 0,
                        })

                        expect(result).toEqual({
                            reviewedCount: 2,
                            xpEarned: 0,
                        })
                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.status).toBe("completed")
                        expect(session.reviewedCount).toBe(2)
                    })

                it("completes a row that got RACED to 'abandoned' by a concurrent start() — the 2026-07-12 stuck-session regression",
                    async () => {
                        const user = await seedUser("kc-complete-raced-abandon")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })

                        // a concurrent start() on the SAME (enrollment, deck) races the
                        // row to "abandoned" before this call's complete() lands
                        await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })
                        const racedRow = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(racedRow.status).toBe("abandoned")

                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        const completedRow = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        // the learner genuinely finished -- their completion wins over the race
                        expect(completedRow.status).toBe("completed")
                        expect(completedRow.reviewedCount).toBe(1)
                    })

                it("refuses to re-flip an ALREADY-completed row — a replay never overwrites the first snapshot",
                    async () => {
                        const user = await seedUser("kc-complete-replay-safe")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        // a replay sends DIFFERENT numbers -- must not overwrite the first snapshot
                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 999,
                            xpEarned: 999,
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.reviewedCount).toBe(1)
                        expect(session.xpEarned).toBe(0)
                    })
            })

        describe("findInProgress / findById — resumable lookups",
            () => {
                it("findInProgress returns the resumable draw scoped to the deck",
                    async () => {
                        const user = await seedUser("kc-find-in-progress")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })
                        await sessionService.sync({
                            userId: user.id,
                            sessionId: started.sessionId,
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 0,
                        })

                        const found = await sessionService.findInProgress({
                            userId: user.id,
                            deckId: deck.id,
                        })

                        expect(found?.sessionId).toBe(started.sessionId)
                        expect(found?.currentIndex).toBe(1)
                        expect(found?.gradedIndexes).toEqual([
                            0,
                        ])
                    })

                it("findInProgress returns null once the session is completed",
                    async () => {
                        const user = await seedUser("kc-find-null-after-complete")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        const found = await sessionService.findInProgress({
                            userId: user.id,
                            deckId: deck.id,
                        })
                        expect(found).toBeNull()
                    })

                it("findById resolves a session's deck identity regardless of status (a stale link still resolves)",
                    async () => {
                        const user = await seedUser("kc-find-by-id")
                        const started = await sessionService.start({
                            userId: user.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        const found = await sessionService.findById({
                            userId: user.id,
                            sessionId: started.sessionId,
                        })

                        expect(found?.deckId).toBe(deck.id)
                        expect(found?.deckTitle).toBe(deck.title)
                    })

                it("findById returns null when the session is not owned by the caller",
                    async () => {
                        const owner = await seedUser("kc-find-owner")
                        const intruder = await seedUser("kc-find-intruder")
                        const started = await sessionService.start({
                            userId: owner.id,
                            deckId: deck.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })

                        const found = await sessionService.findById({
                            userId: intruder.id,
                            sessionId: started.sessionId,
                        })
                        expect(found).toBeNull()
                    })
            })
    })
