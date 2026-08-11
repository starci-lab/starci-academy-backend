import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    FlashcardQuizSessionService,
} from "@modules/bussiness/flashcard/flashcard-quiz-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    UserFlashcardStatsProjectionService,
} from "@modules/bussiness/projections/user-flashcard-stats/user-flashcard-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    CompleteFlashcardQuizSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/complete-flashcard-quiz-session/complete-flashcard-quiz-session.resolver"
import {
    StartFlashcardQuizSessionHandler,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/start-flashcard-quiz-session.handler"
import {
    StartFlashcardQuizSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/start-flashcard-quiz-session.resolver"
import {
    StartFlashcardQuizSessionService,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/start-flashcard-quiz-session.service"
import {
    SyncFlashcardQuizSessionProgressHandler,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.handler"
import {
    SyncFlashcardQuizSessionProgressResolver,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.resolver"
import {
    SyncFlashcardQuizSessionProgressService,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"
const EXPECTED_XP = 5
const EXPECTED_POINTS = 5

/**
 * Production flow: GraphQL start -> GraphQL progress sync -> GraphQL complete.
 * Postgres is used only to arrange the actor/catalogue and assert the durable
 * session and ledger consequences. A replay travels through the same mutation
 * because idempotency is part of the business promise.
 */
describe("a learner completes a flashcard quiz and receives one durable reward",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let course: CourseEntity
        let cards: Array<FlashcardCardEntity>
        let sessionId: string

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const gql = async <T>(query: string, input: Record<string, unknown>): Promise<T> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query,
                    variables: {
                        request: input,
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            return response.body.data as T
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                ],
                providers: [
                    StartFlashcardQuizSessionResolver,
                    StartFlashcardQuizSessionService,
                    StartFlashcardQuizSessionHandler,
                    SyncFlashcardQuizSessionProgressResolver,
                    SyncFlashcardQuizSessionProgressService,
                    SyncFlashcardQuizSessionProgressHandler,
                    CompleteFlashcardQuizSessionResolver,
                    FlashcardQuizSessionService,
                    UserFlashcardStatsProjectionService,
                    UserService,
                    GraphQLEnrollmentGuard,
                    {
                        provide: KeycloakAuthGraphQLGuard,
                        useValue: fakeAuthGuard,
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                            del: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: {
                            searchCourse: jest.fn().mockResolvedValue({
                                hits: [],
                            }),
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )

            await entityManager.query(
                "TRUNCATE TABLE \"flashcard_decks\", \"users\", \"courses\" RESTART IDENTITY CASCADE",
            )
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-flashcard-quiz-flow",
                }))
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: "fullstack-mastery-flashcard-flow",
                    description: "Flashcard flow fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            const deck = await entityManager.save(entityManager.create(FlashcardDeckEntity,
                {
                    title: "NestJS Fundamentals",
                    displayId: "nestjs-flashcard-flow",
                    description: "Flashcard flow deck",
                    difficulty: ChallengeDifficulty.Medium,
                    defaultLocale: Locale.En,
                    course,
                }))
            cards = await entityManager.save([
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is dependency injection?",
                        answer: "Dependencies are supplied from outside.",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                        tags: [
                            "NestJS",
                        ],
                    }),
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is a provider?",
                        answer: "A provider is managed by the Nest container.",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                        tags: [],
                    }),
            ])
        })

        afterAll(async () => {
            await entityManager?.query(
                "TRUNCATE TABLE \"flashcard_decks\", \"users\", \"courses\" RESTART IDENTITY CASCADE",
            ).catch(() => undefined)
            await app?.close().catch(() => undefined)
        })

        it("starts a resumable server session through GraphQL",
            async () => {
                const result = await gql<{
                    startFlashcardQuizSession: { data: { sessionId: string } }
                }>(`
                    mutation Start($request: StartFlashcardQuizSessionRequest!) {
                        startFlashcardQuizSession(request: $request) {
                            data { sessionId }
                        }
                    }
                `,
                {
                    courseId: course.id,
                    cardIds: cards.map((card) => card.id),
                    mode: "quick",
                    level: null,
                    name: "Interview prep",
                })
                sessionId = result.startFlashcardQuizSession.data.sessionId

                const session = await entityManager.findOneByOrFail(
                    FlashcardQuizSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.status).toBe("in_progress")
                expect(session.cardIds).toEqual(cards.map((card) => card.id))
                expect(session.name).toBe("Interview prep")
            })

        it("syncs the learner's progress through GraphQL",
            async () => {
                await gql(`
                    mutation Sync($request: SyncFlashcardQuizSessionProgressRequest!) {
                        syncFlashcardQuizSessionProgress(request: $request) {
                            data { success }
                        }
                    }
                `,
                {
                    sessionId,
                    currentIndex: 1,
                    results: [
                        {
                            cardId: cards[0].id,
                            correctBlanks: 1,
                            totalBlanks: 1,
                        },
                    ],
                })

                const session = await entityManager.findOneByOrFail(
                    FlashcardQuizSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.currentIndex).toBe(1)
                expect(session.results).toHaveLength(1)
            })

        it("completes the session and persists the XP and points consequence",
            async () => {
                const result = await gql<{
                    completeFlashcardQuizSession: { data: { xpEarned: number } }
                }>(`
                    mutation Complete($request: CompleteFlashcardQuizSessionRequest!) {
                        completeFlashcardQuizSession(request: $request) {
                            data { xpEarned dailyCapReached }
                        }
                    }
                `,
                {
                    sessionId,
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
                expect(result.completeFlashcardQuizSession.data.xpEarned).toBe(EXPECTED_XP)

                const session = await entityManager.findOneByOrFail(
                    FlashcardQuizSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.status).toBe("completed")
                expect(session.xpEarned).toBe(EXPECTED_XP)

                const ledger = await entityManager.findOneOrFail(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            source: XpSource.FlashcardQuiz,
                            refId: sessionId,
                        },
                    })
                expect(ledger.amount).toBe(EXPECTED_XP)
                expect(ledger.points).toBe(EXPECTED_POINTS)
            })

        it("keeps the reward idempotent when the production mutation is replayed",
            async () => {
                const result = await gql<{
                    completeFlashcardQuizSession: { data: { xpEarned: number } }
                }>(`
                    mutation Complete($request: CompleteFlashcardQuizSessionRequest!) {
                        completeFlashcardQuizSession(request: $request) {
                            data { xpEarned }
                        }
                    }
                `,
                {
                    sessionId,
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
                expect(result.completeFlashcardQuizSession.data.xpEarned).toBe(0)
                expect(await entityManager.count(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            source: XpSource.FlashcardQuiz,
                            refId: sessionId,
                        },
                    })).toBe(1)
            })
    })
