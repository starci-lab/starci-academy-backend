import {
    randomUUID,
} from "crypto"
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
    FlashcardCardEntity,
    FlashcardDeckEntity,
    FlashcardQuizSessionEntity,
    Locale,
    PrimaryPostgreSQLModule,
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    CacheService,
} from "@modules/cache"
import {
    FlashcardQuizSessionService,
    UserFlashcardStatsProjectionService,
    UserService,
} from "@modules/bussiness"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    StartFlashcardQuizSessionHandler,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/start-flashcard-quiz-session.handler"
import {
    StartFlashcardQuizSessionCommand,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/start-flashcard-quiz-session.command"
import {
    SyncFlashcardQuizSessionProgressHandler,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.handler"
import {
    SyncFlashcardQuizSessionProgressCommand,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.command"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Coverage-weighted reward, per card, before the per-session cap applies. */
const PER_CARD_XP = 3
/** Hard ceiling on the XP one quick-quiz session can ever grant. */
const MAX_XP_PER_SESSION = 15
/** Coin/Points reward flat-credited alongside any non-zero XP grant. */
const FLASHCARD_QUIZ_SESSION_POINTS = 5

/**
 * e2e for the flashcard quick-quiz ("Hỏi nhanh") session's start → sync →
 * complete lifecycle — `.claude/canon/be/enforce/authoring/testing.md` §2
 * names "a flashcard review" as a write flow that must carry
 * `*.e2e-spec.ts` coverage; this is that coverage for
 * `startFlashcardQuizSession`/`syncFlashcardQuizSessionProgress` (thin CQRS
 * handlers under `features/api`, called directly here — bypassing
 * `CommandBus` — since {@link import("@modules/platform/cqrs").ICQRSHandler.execute}
 * dispatches straight to `process`, no bus wiring needed) and
 * {@link FlashcardQuizSessionService.complete} (the bussiness-layer XP grant
 * under test), run against REAL Postgres (Testcontainers).
 *
 * MOCKED (no external infra available in this harness):
 *  - `CacheService` — real class talks to Redis; stubbed to always miss.
 *  - `ContentRagRetrievalService` — real class talks to Qdrant; stubbed to
 *    return no hits, so a session that DOES rank weak tags still degrades
 *    exactly like a production Qdrant outage (tag + coverage kept, no deep
 *    link) rather than needing a live vector index in the test harness.
 *
 * REAL: Postgres (Testcontainers), the start/sync handlers, `UserService`
 * (`resolveOrCreateTrialEnrollment` runs real SQL), `FlashcardQuizSessionService`
 * (the XP-grant logic under test), `UserFlashcardStatsProjectionService`
 * (the readiness proxy, pure Postgres — no external deps).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Flashcard quiz session — start/sync/complete + XP grant (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let startHandler: StartFlashcardQuizSessionHandler
        let syncHandler: SyncFlashcardQuizSessionProgressHandler
        let quizSessionService: FlashcardQuizSessionService

        /** Read-only fixtures seeded ONCE — only per-test user/session/XP state is reset. */
        let course: CourseEntity
        let deck: FlashcardDeckEntity
        let cards: Array<FlashcardCardEntity>

        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }
        const contentRagRetrievalServiceMock = {
            searchCourse: jest.fn().mockResolvedValue({
                hits: [],
            }),
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
                    // REAL — the CQRS handlers under test (called directly, no CommandBus)
                    StartFlashcardQuizSessionHandler,
                    SyncFlashcardQuizSessionProgressHandler,
                    // REAL — the XP-grant/completion logic under test
                    FlashcardQuizSessionService,
                    // REAL — the readiness proxy `complete()` reads (pure Postgres, no
                    // external deps)
                    UserFlashcardStatsProjectionService,
                    // REAL — resolveOrCreateTrialEnrollment runs real SQL
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: ContentRagRetrievalService,
                        useValue: contentRagRetrievalServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            startHandler = app.get(StartFlashcardQuizSessionHandler)
            syncHandler = app.get(SyncFlashcardQuizSessionProgressHandler)
            quizSessionService = app.get(FlashcardQuizSessionService)

            // seed the read-only course/deck/card fixtures ONCE — only
            // users/enrollments/session/XP state are reset between tests
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-quiz-session-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            deck = await entityManager.save(
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-quiz-session-e2e",
                        description: "e2e fixture deck",
                        difficulty: ChallengeDifficulty.Medium,
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            // ten cards so a "fully correct" session can exercise the
            // per-session XP cap (10 cards * PER_CARD_XP(3) = 30 > cap of 15)
            cards = []
            for (let index = 0; index < 10; index += 1) {
                 
                const card = await entityManager.save(
                    entityManager.create(FlashcardCardEntity,
                        {
                            question: `Question ${index}`,
                            answer: `Answer ${index}`,
                            isPremium: false,
                            defaultLocale: Locale.En,
                            deck,
                            tags: index === 0 ? [
                                "NestJS",
                            ] : [],
                        }),
                )
                cards.push(card)
            }
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/enrollment/session/XP state; course/deck/card
            // fixtures (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"flashcard_quiz_sessions\", \"xp_histories\", \"user_flashcard_stats_projections\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
            contentRagRetrievalServiceMock.searchCourse.mockResolvedValue({
                hits: [],
            })
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
                it("persists a fresh in_progress session with the drawn cardIds/mode/level, anchored to a trial (is_enrolled=false) enrollment",
                    async () => {
                        const user = await seedUser("kc-start-fresh")

                        const result = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                        cards[1].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                    name: "Ôn trước phỏng vấn",
                                },
                                user,
                            }),
                        )

                        const session = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: result.sessionId,
                                },
                            },
                        )
                        expect(session.status).toBe("in_progress")
                        expect(session.cardIds).toEqual([
                            cards[0].id,
                            cards[1].id,
                        ])
                        expect(session.mode).toBe("quick")
                        expect(session.name).toBe("Ôn trước phỏng vấn")
                        expect(session.currentIndex).toBe(0)
                        expect(session.results).toEqual([])
                    })

                it("starting a SECOND draw for the same enrollment abandons the prior in_progress row",
                    async () => {
                        const user = await seedUser("kc-start-retire-prior")

                        const first = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )
                        await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                        cards[1].id,
                                    ],
                                    mode: "deep",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        const firstRow = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: first.sessionId,
                                },
                            },
                        )
                        expect(firstRow.status).toBe("abandoned")

                        const inProgressCount = await entityManager.count(
                            FlashcardQuizSessionEntity,
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
                it("applies currentIndex + per-card results to an owned in_progress session",
                    async () => {
                        const user = await seedUser("kc-sync-applies")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                        cards[1].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        const result = await syncHandler.execute(
                            new SyncFlashcardQuizSessionProgressCommand({
                                request: {
                                    sessionId: started.sessionId,
                                    currentIndex: 1,
                                    results: [
                                        {
                                            cardId: cards[0].id,
                                            correctBlanks: 2,
                                            totalBlanks: 2,
                                        },
                                    ],
                                },
                                user,
                            }),
                        )

                        expect(result.success).toBe(true)
                        const session = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(1)
                        expect(session.results).toEqual([
                            {
                                cardId: cards[0].id,
                                correctBlanks: 2,
                                totalBlanks: 2,
                            },
                        ])
                    })

                it("no-ops (returns success: false, mutates nothing) for a session owned by a DIFFERENT user",
                    async () => {
                        const owner = await seedUser("kc-sync-owner")
                        const intruder = await seedUser("kc-sync-intruder")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user: owner,
                            }),
                        )

                        const result = await syncHandler.execute(
                            new SyncFlashcardQuizSessionProgressCommand({
                                request: {
                                    sessionId: started.sessionId,
                                    currentIndex: 5,
                                    results: [],
                                },
                                user: intruder,
                            }),
                        )

                        expect(result.success).toBe(false)
                        const session = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.currentIndex).toBe(0)
                    })

                it("no-ops for a session that already completed",
                    async () => {
                        const user = await seedUser("kc-sync-completed")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )
                        await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 1,
                                    totalBlanks: 1,
                                },
                            ],
                        })

                        const result = await syncHandler.execute(
                            new SyncFlashcardQuizSessionProgressCommand({
                                request: {
                                    sessionId: started.sessionId,
                                    currentIndex: 1,
                                    results: [],
                                },
                                user,
                            }),
                        )
                        expect(result.success).toBe(false)
                    })
            })

        describe("complete — coverage-weighted, capped, idempotent XP grant",
            () => {
                it("grants round(coverage * cards * 3) XP, flips the row to completed, and credits the flat Points to coin_balance",
                    async () => {
                        const user = await seedUser("kc-complete-basic")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                        cards[1].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        // 2 cards, 3/4 average coverage -> round(0.75 * 2 * 3) = round(4.5) = 5 (banker's/half-up per Math.round)
                        const result = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 1,
                                    totalBlanks: 1,
                                },
                                {
                                    cardId: cards[1].id,
                                    correctBlanks: 1,
                                    totalBlanks: 2,
                                },
                            ],
                        })

                        const expectedXp = Math.round((1 + 0.5) / 2 * 2 * PER_CARD_XP)
                        expect(result.xpEarned).toBe(expectedXp)
                        expect(result.dailyCapReached).toBe(false)

                        const session = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(session.status).toBe("completed")
                        expect(session.xpEarned).toBe(expectedXp)
                        expect(session.coverage).toBeCloseTo((1 + 0.5) / 2)

                        const xpHistory = await entityManager.findOneOrFail(
                            XpHistoryEntity,
                            {
                                where: {
                                    // XpHistoryEntity.userId is a bare @RelationId
                                    // (no @Column) — not queryable in `where`; filter
                                    // through the relation instead
                                    user: {
                                        id: user.id,
                                    },
                                    source: XpSource.FlashcardQuiz,
                                },
                            },
                        )
                        expect(xpHistory.amount).toBe(expectedXp)
                        expect(xpHistory.points).toBe(FLASHCARD_QUIZ_SESSION_POINTS)
                        expect(xpHistory.refId).toBe(started.sessionId)

                        const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: user.id,
                                },
                            })
                        expect(reloadedUser.coinBalance).toBe(FLASHCARD_QUIZ_SESSION_POINTS)
                    })

                it("caps the reward at MAX_XP_PER_SESSION even on a fully-correct 10-card session",
                    async () => {
                        const user = await seedUser("kc-complete-cap")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: cards.map((card) => card.id),
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        const result = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: cards.map((card) => ({
                                cardId: card.id,
                                correctBlanks: 1,
                                totalBlanks: 1,
                            })),
                        })

                        // 10 cards * 100% coverage * 3 XP/card = 30, hard-capped to 15
                        expect(result.xpEarned).toBe(MAX_XP_PER_SESSION)
                    })

                it("is idempotent on sessionId — a replay grants ZERO XP and writes NO second ledger row",
                    async () => {
                        const user = await seedUser("kc-complete-idempotent")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )
                        const answers = [
                            {
                                cardId: cards[0].id,
                                correctBlanks: 1,
                                totalBlanks: 1,
                            },
                        ]

                        const first = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers,
                        })
                        const second = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers,
                        })

                        expect(first.xpEarned).toBeGreaterThan(0)
                        expect(second.xpEarned).toBe(0)

                        const xpHistoryCount = await entityManager.count(XpHistoryEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    source: XpSource.FlashcardQuiz,
                                },
                            })
                        expect(xpHistoryCount).toBe(1)
                    })

                it("clamps the grant to the remaining DAILY_QUIZ_XP_CAP headroom for the (user, course) pair",
                    async () => {
                        const user = await seedUser("kc-complete-daily-cap")
                        // pre-existing grants totalling 58 today, leaving only 2 headroom
                        // under the 60/day cap for this (user, course) — a fully-correct
                        // single card would earn round(1*1*3)=3, which EXCEEDS the 2
                        // remaining headroom, so the clamp must actually engage
                        await entityManager.save(XpHistoryEntity,
                            {
                                user: {
                                    id: user.id,
                                },
                                course: {
                                    id: course.id,
                                },
                                source: XpSource.FlashcardQuiz,
                                amount: 58,
                                points: 0,
                                refId: randomUUID(),
                            })

                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        const result = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 1,
                                    totalBlanks: 1,
                                },
                            ],
                        })

                        // sessionAmount (3) clamped down to the 2 remaining headroom
                        expect(result.xpEarned).toBe(2)
                        expect(result.dailyCapReached).toBe(true)

                        const grantedTotal = await entityManager
                            .createQueryBuilder(XpHistoryEntity,
                                "history")
                            .select("COALESCE(SUM(history.amount), 0)",
                                "sum")
                            .where("history.user_id = :userId",
                                {
                                    userId: user.id,
                                })
                            .andWhere("history.source = :source",
                                {
                                    source: XpSource.FlashcardQuiz,
                                })
                            .getRawOne<{ sum: string }>()
                        // the cap is never exceeded — 58 (baseline) + 2 (clamped grant) = 60
                        expect(Number(grantedTotal?.sum)).toBe(60)
                    })

                it("weakTags surfaces the ranked tag with its coverage, degrading to no deep link when RAG returns no hits",
                    async () => {
                        const user = await seedUser("kc-complete-weak-tags")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        // cards[0] carries the "NestJS" tag (seeded in beforeAll)
                        const result = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 0,
                                    totalBlanks: 2,
                                },
                            ],
                        })

                        expect(result.weakTags).toEqual([
                            {
                                tag: "NestJS",
                                coverage: 0,
                            },
                        ])
                        expect(contentRagRetrievalServiceMock.searchCourse).toHaveBeenCalledWith(
                            expect.objectContaining({
                                courseId: course.id,
                                query: "NestJS",
                            }),
                        )
                    })

                it("readiness reports the flashcard-stats retention rate against the job-readiness threshold",
                    async () => {
                        const user = await seedUser("kc-complete-readiness")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        const result = await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 1,
                                    totalBlanks: 1,
                                },
                            ],
                        })

                        // no review history yet for this fresh user -> 0 retention, below threshold
                        expect(result.readiness).toEqual({
                            currentAvg: 0,
                            threshold: result.readiness.threshold,
                            unlocked: false,
                        })
                    })

                it("completes a row that got RACED to 'abandoned' by a concurrent start() — same Not(\"completed\") guard as the review/due-review sessions",
                    async () => {
                        const user = await seedUser("kc-complete-raced-abandon")
                        const started = await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[0].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )

                        // a concurrent start() on the SAME enrollment races the row to
                        // "abandoned" before this call's complete() lands
                        await startHandler.execute(
                            new StartFlashcardQuizSessionCommand({
                                request: {
                                    courseId: course.id,
                                    cardIds: [
                                        cards[1].id,
                                    ],
                                    mode: "quick",
                                    level: null,
                                },
                                user,
                            }),
                        )
                        const racedRow = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(racedRow.status).toBe("abandoned")

                        await quizSessionService.complete({
                            userId: user.id,
                            sessionId: started.sessionId,
                            courseId: course.id,
                            answers: [
                                {
                                    cardId: cards[0].id,
                                    correctBlanks: 1,
                                    totalBlanks: 1,
                                },
                            ],
                        })

                        const completedRow = await entityManager.findOneOrFail(
                            FlashcardQuizSessionEntity,
                            {
                                where: {
                                    id: started.sessionId,
                                },
                            },
                        )
                        expect(completedRow.status).toBe("completed")
                    })
            })
    })
