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
    FlashcardReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-review-session.service"
import {
    FlashcardReviewService,
} from "@modules/bussiness/flashcard/flashcard-review.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
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
    FlashcardReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-session.entity"
import {
    UserFlashcardReviewEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-review.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    FlashcardCardResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-card-resolver.service"
import {
    TranslationResolverService,
} from "@modules/databases/postgresql/primary/resolvers/translation.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CompleteFlashcardReviewSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/complete-flashcard-review-session/complete-flashcard-review-session.resolver"
import {
    ReviewFlashcardResolver,
} from "@features/api/core/graphql/mutations/flashcard/review-flashcard/review-flashcard.resolver"
import {
    StartFlashcardReviewSessionHandler,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-review-session/start-flashcard-review-session.handler"
import {
    StartFlashcardReviewSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-review-session/start-flashcard-review-session.resolver"
import {
    StartFlashcardReviewSessionService,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-review-session/start-flashcard-review-session.service"
import {
    SyncFlashcardReviewSessionProgressHandler,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-review-session-progress/sync-flashcard-review-session-progress.handler"
import {
    SyncFlashcardReviewSessionProgressResolver,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-review-session-progress/sync-flashcard-review-session-progress.resolver"
import {
    SyncFlashcardReviewSessionProgressService,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-review-session-progress/sync-flashcard-review-session-progress.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"

/** A learner starts, resumes, and completes one deck-scoped review session. */
describe("a learner completes a resumable flashcard review session",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let deck: FlashcardDeckEntity
        let cards: Array<FlashcardCardEntity>
        let sessionId: string

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = learner
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
                    StartFlashcardReviewSessionResolver,
                    StartFlashcardReviewSessionService,
                    StartFlashcardReviewSessionHandler,
                    SyncFlashcardReviewSessionProgressResolver,
                    SyncFlashcardReviewSessionProgressService,
                    SyncFlashcardReviewSessionProgressHandler,
                    CompleteFlashcardReviewSessionResolver,
                    FlashcardReviewSessionService,
                    ReviewFlashcardResolver,
                    FlashcardReviewService,
                    FlashcardDeckResolverService,
                    FlashcardCardResolverService,
                    TranslationResolverService,
                    GraphQLEnrollmentGuard,
                    UserService,
                    {
                        provide: CacheService,
                        useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                            del: jest.fn().mockResolvedValue(undefined),
                        },
                    },
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
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(authGuard)
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
                    keycloakId: "kc-flashcard-review-flow",
                }))
            const course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: "flashcard-review-flow-course",
                    description: "Review flow fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            deck = await entityManager.save(entityManager.create(FlashcardDeckEntity,
                {
                    title: "NestJS",
                    displayId: "flashcard-review-flow-deck",
                    description: "Review flow deck",
                    difficulty: ChallengeDifficulty.Medium,
                    defaultLocale: Locale.En,
                    course,
                }))
            cards = await entityManager.save([
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is DI?",
                        answer: "Dependency injection",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is a provider?",
                        answer: "A managed dependency",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck,
                    }),
            ])
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("starts the server-owned draw through GraphQL",
            async () => {
                const result = await gql<{
                    startFlashcardReviewSession: { data: { sessionId: string } }
                }>(`
                    mutation Start($request: StartFlashcardReviewSessionRequest!) {
                        startFlashcardReviewSession(request: $request) {
                            data { sessionId }
                        }
                    }
                `,
                {
                    deckId: deck.id,
                    cardIds: cards.map((card) => card.id),
                    mode: "full",
                })
                sessionId = result.startFlashcardReviewSession.data.sessionId
                const row = await entityManager.findOneByOrFail(FlashcardReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.status).toBe("in_progress")
                expect(row.cardIds).toEqual(cards.map((card) => card.id))
            })

        it("syncs the resumable position through GraphQL",
            async () => {
                const review = await gql<{
                    reviewFlashcard: { data: { xpEarned: number } }
                }>(`
                    mutation Review($request: ReviewFlashcardRequest!) {
                        reviewFlashcard(request: $request) {
                            data { dueAt xpEarned }
                        }
                    }
                `,
                {
                    cardId: cards[0].id,
                    grade: 2,
                    sessionId,
                })
                expect(review.reviewFlashcard.data.xpEarned).toBe(2)
                await gql(`
                    mutation Sync($request: SyncFlashcardReviewSessionProgressRequest!) {
                        syncFlashcardReviewSessionProgress(request: $request) {
                            data { success }
                        }
                    }
                `,
                {
                    sessionId,
                    currentIndex: 1,
                    reviewedCount: 1,
                    gradedIndexes: [
                        0,
                    ],
                    xpEarned: 0,
                })
                const row = await entityManager.findOneByOrFail(FlashcardReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.currentIndex).toBe(1)
                expect(row.reviewedCount).toBe(1)
                expect(row.gradedIndexes).toEqual([
                    0,
                ])
                const schedule = await entityManager.findOneOrFail(UserFlashcardReviewEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            flashcardCard: {
                                id: cards[0].id,
                            },
                        },
                    })
                expect(schedule.repetitions).toBe(1)
            })

        it("completes the same durable session through GraphQL",
            async () => {
                await gql(`
                    mutation Complete($request: CompleteFlashcardReviewSessionRequest!) {
                        completeFlashcardReviewSession(request: $request) {
                            data { reviewedCount xpEarned }
                        }
                    }
                `,
                {
                    sessionId,
                    reviewedCount: 2,
                    xpEarned: 0,
                })
                const row = await entityManager.findOneByOrFail(FlashcardReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.status).toBe("completed")
                expect(row.reviewedCount).toBe(2)
            })
    })
