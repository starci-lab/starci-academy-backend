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
    CourseEntity,
    EnrollmentEntity,
    FlashcardCardEntity,
    ChallengeDifficulty,
    FlashcardDeckEntity,
    FlashcardDueReviewSessionEntity,
    Locale,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    CacheService,
} from "@modules/cache"
import {
    FlashcardDueReviewSessionService,
    UserService,
} from "@modules/bussiness"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the resumable CROSS-DECK due-review batch ("DueReview") session
 * bookkeeping wrapper — `.claude/canon/be/enforce/authoring/testing.md` §2
 * names "a flashcard review" as a write flow that must carry
 * `*.e2e-spec.ts` coverage; this is that coverage for
 * {@link FlashcardDueReviewSessionService}'s start → sync → complete
 * lifecycle, run against REAL Postgres (Testcontainers). Unlike the per-deck
 * `FlashcardReviewSessionService`, this session is scoped to an ENROLLMENT
 * only (a batch spans multiple decks in one course) — the actual SM-2 grading
 * still runs through `reviewFlashcard`, covered separately by
 * `flashcard-review.e2e-spec.ts`.
 *
 * MOCKED (no external infra available in this harness):
 *  - `CacheService` — real class talks to Redis; stubbed to always miss so
 *    `UserService.resolveOrCreateTrialEnrollment` hits real Postgres every
 *    time, never a stale cross-test cache entry.
 *
 * REAL: Postgres (Testcontainers), `FlashcardDueReviewSessionService` (the
 * service under test), `UserService` (`resolveOrCreateTrialEnrollment` runs
 * real SQL against real `enrollments` rows).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Flashcard due-review BATCH session — start/sync/complete lifecycle (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let sessionService: FlashcardDueReviewSessionService

        /** Read-only fixtures seeded ONCE — only per-test user/session state is reset. */
        let course: CourseEntity
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
                    // real Postgres against the Testcontainers DB — no hydration/
                    // resolvers-module/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL — the batch start/sync/complete/find logic under test
                    FlashcardDueReviewSessionService,
                    // REAL — resolveOrCreateTrialEnrollment runs real SQL against
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
            sessionService = app.get(FlashcardDueReviewSessionService)

            // seed the read-only course/deck/card fixtures ONCE — only
            // users/enrollments/session state are reset between tests
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-due-review-session-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            // two DIFFERENT decks — a due-review batch spans multiple decks in one course
            const deckOne = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-due-review-session-e2e",
                        description: "e2e fixture deck 1",
                        difficulty: ChallengeDifficulty.Medium,
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const deckTwo = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "TypeORM Deep Dive",
                        displayId: "typeorm-deep-dive-due-review-session-e2e",
                        description: "e2e fixture deck 2",
                        difficulty: ChallengeDifficulty.Hard,
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
                        deck: deckOne,
                    }),
            )
            cardB = await entityManager.save(
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is the Unit of Work pattern?",
                        answer: "ANSWER_B",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck: deckTwo,
                    }),
            )
        })

        afterAll(async () => {
            // the deck/card fixtures are read-only WITHIN this suite, but the
            // Testcontainers Postgres is shared across the whole e2e run (see
            // setup-e2e.ts) — leaving them behind pollutes any OTHER file's
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
            // reset per-test user/enrollment/session state; course/deck/card
            // fixtures (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"flashcard_due_review_sessions\" RESTART IDENTITY CASCADE",
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

        describe("start — persists a resumable CROSS-DECK draw anchored to a trial enrollment",
            () => {
                it("persists a fresh in_progress session carrying cards drawn from MULTIPLE decks, anchored to a trial (is_enrolled=false) enrollment",
                    async () => {
                        const user = await seedUser("kc-start-fresh")

                        const result = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardDueReviewSessionEntity,
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

                it("starting a SECOND draw for the same enrollment abandons the prior in_progress row — never two resumable drafts at once",
                    async () => {
                        const user = await seedUser("kc-start-retire-prior")

                        const first = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        const second = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })

                        const firstRow = await entityManager.findOneOrFail(
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: first.sessionId,
                                },
                            },
                        )
                        expect(firstRow.status).toBe("abandoned")

                        const secondRow = await entityManager.findOneOrFail(
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: second.sessionId,
                                },
                            },
                        )
                        expect(secondRow.status).toBe("in_progress")

                        const inProgressCount = await entityManager.count(
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    status: "in_progress",
                                },
                            },
                        )
                        expect(inProgressCount).toBe(1)
                    })
            })

        describe("sync — ownership-scoped, silent no-op instead of throwing",
            () => {
                it("applies currentIndex/reviewedCount/gradedIndexes/xpEarned to an owned in_progress session",
                    async () => {
                        const user = await seedUser("kc-sync-applies")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(1)
                        expect(session.gradedIndexes).toEqual([
                            0,
                        ])
                    })

                it("omitting gradedIndexes leaves the previously-synced set UNTOUCHED",
                    async () => {
                        const user = await seedUser("kc-sync-omit-graded")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(2)
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
                            courseId: course.id,
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
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(0)
                    })
            })

        describe("complete — snapshot + replay-safe, tolerant of a raced 'abandoned' status",
            () => {
                it("flips status to completed and snapshots reviewedCount/xpEarned",
                    async () => {
                        const user = await seedUser("kc-complete-basic")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.status).toBe("completed")
                    })

                it("completes a row that got RACED to 'abandoned' by a concurrent start() — the 2026-07-12 stuck-session regression (refresh still showed the last card)",
                    async () => {
                        const user = await seedUser("kc-complete-raced-abandon")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })

                        // a concurrent start() on the SAME enrollment races the row to
                        // "abandoned" before this call's complete() lands
                        await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                                cardB.id,
                            ],
                        })
                        const racedRow = await entityManager.findOneOrFail(
                            FlashcardDueReviewSessionEntity,
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
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(completedRow.status).toBe("completed")
                        expect(completedRow.reviewedCount).toBe(1)
                    })

                it("refuses to re-flip an ALREADY-completed row — a replay never overwrites the first snapshot",
                    async () => {
                        const user = await seedUser("kc-complete-replay-safe")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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

                        await sessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            reviewedCount: 999,
                            xpEarned: 999,
                        })

                        const session = await entityManager.findOneOrFail(
                            FlashcardDueReviewSessionEntity,
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

        describe("findInProgress / findById — resumable lookups scoped by COURSE (not deck — a batch spans many)",
            () => {
                it("findInProgress returns the resumable draw scoped to the course",
                    async () => {
                        const user = await seedUser("kc-find-in-progress")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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
                            courseId: course.id,
                        })

                        expect(found?.sessionId).toBe(started.sessionId)
                        expect(found?.currentIndex).toBe(1)
                        expect(found?.cardIds).toEqual([
                            cardA.id,
                            cardB.id,
                        ])
                    })

                it("findInProgress returns null once the session is completed",
                    async () => {
                        const user = await seedUser("kc-find-null-after-complete")
                        const started = await sessionService.start({
                            userId: user.id,
                            courseId: course.id,
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
                            courseId: course.id,
                        })
                        expect(found).toBeNull()
                    })

                it("findById resolves regardless of status (a stale link still resolves), ownership-scoped",
                    async () => {
                        const owner = await seedUser("kc-find-owner")
                        const intruder = await seedUser("kc-find-intruder")
                        const started = await sessionService.start({
                            userId: owner.id,
                            courseId: course.id,
                            cardIds: [
                                cardA.id,
                            ],
                        })
                        await sessionService.complete({
                            userId: owner.id,
                            sessionId: started.sessionId,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        const found = await sessionService.findById({
                            userId: owner.id,
                            sessionId: started.sessionId,
                        })
                        expect(found?.sessionId).toBe(started.sessionId)

                        const notOwned = await sessionService.findById({
                            userId: intruder.id,
                            sessionId: started.sessionId,
                        })
                        expect(notOwned).toBeNull()
                    })
            })
    })
