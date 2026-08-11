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
    FlashcardDueReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-due-review-session.service"
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
    FlashcardDueReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-due-review-session.entity"
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
    CompleteFlashcardDueReviewSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/complete-flashcard-due-review-session/complete-flashcard-due-review-session.resolver"
import {
    StartFlashcardDueReviewSessionHandler,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-due-review-session/start-flashcard-due-review-session.handler"
import {
    StartFlashcardDueReviewSessionResolver,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-due-review-session/start-flashcard-due-review-session.resolver"
import {
    StartFlashcardDueReviewSessionService,
} from "@features/api/core/graphql/mutations/flashcard/start-flashcard-due-review-session/start-flashcard-due-review-session.service"
import {
    SyncFlashcardDueReviewSessionProgressHandler,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-due-review-session-progress/sync-flashcard-due-review-session-progress.handler"
import {
    SyncFlashcardDueReviewSessionProgressResolver,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-due-review-session-progress/sync-flashcard-due-review-session-progress.resolver"
import {
    SyncFlashcardDueReviewSessionProgressService,
} from "@features/api/core/graphql/mutations/flashcard/sync-flashcard-due-review-session-progress/sync-flashcard-due-review-session-progress.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"

/** A learner reviews one due batch spanning multiple course decks. */
describe("a learner completes a cross-deck due-review session",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let course: CourseEntity
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
                    StartFlashcardDueReviewSessionResolver,
                    StartFlashcardDueReviewSessionService,
                    StartFlashcardDueReviewSessionHandler,
                    SyncFlashcardDueReviewSessionProgressResolver,
                    SyncFlashcardDueReviewSessionProgressService,
                    SyncFlashcardDueReviewSessionProgressHandler,
                    CompleteFlashcardDueReviewSessionResolver,
                    FlashcardDueReviewSessionService,
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
                    keycloakId: "kc-due-review-flow",
                }))
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: "due-review-flow-course",
                    description: "Due-review flow fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            const decks = await entityManager.save([
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "NestJS",
                        displayId: "due-review-flow-deck-a",
                        description: "First deck",
                        difficulty: ChallengeDifficulty.Medium,
                        defaultLocale: Locale.En,
                        course,
                    }),
                entityManager.create(FlashcardDeckEntity,
                    {
                        title: "TypeORM",
                        displayId: "due-review-flow-deck-b",
                        description: "Second deck",
                        difficulty: ChallengeDifficulty.Hard,
                        defaultLocale: Locale.En,
                        course,
                    }),
            ])
            cards = await entityManager.save([
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is DI?",
                        answer: "Dependency injection",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck: decks[0],
                    }),
                entityManager.create(FlashcardCardEntity,
                    {
                        question: "What is Unit of Work?",
                        answer: "A transaction boundary",
                        isPremium: false,
                        defaultLocale: Locale.En,
                        deck: decks[1],
                    }),
            ])
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("starts the cross-deck batch through GraphQL",
            async () => {
                const result = await gql<{
                    startFlashcardDueReviewSession: { data: { sessionId: string } }
                }>(`
                    mutation Start($request: StartFlashcardDueReviewSessionRequest!) {
                        startFlashcardDueReviewSession(request: $request) {
                            data { sessionId }
                        }
                    }
                `,
                {
                    courseId: course.id,
                    cardIds: cards.map((card) => card.id),
                })
                sessionId = result.startFlashcardDueReviewSession.data.sessionId
                const row = await entityManager.findOneByOrFail(FlashcardDueReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.status).toBe("in_progress")
                expect(row.cardIds).toEqual(cards.map((card) => card.id))
            })

        it("syncs the cross-deck progress through GraphQL",
            async () => {
                await gql(`
                    mutation Sync($request: SyncFlashcardDueReviewSessionProgressRequest!) {
                        syncFlashcardDueReviewSessionProgress(request: $request) {
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
                const row = await entityManager.findOneByOrFail(FlashcardDueReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.currentIndex).toBe(1)
                expect(row.reviewedCount).toBe(1)
            })

        it("completes the durable due-review batch through GraphQL",
            async () => {
                await gql(`
                    mutation Complete($request: CompleteFlashcardDueReviewSessionRequest!) {
                        completeFlashcardDueReviewSession(request: $request) {
                            data { reviewedCount xpEarned }
                        }
                    }
                `,
                {
                    sessionId,
                    reviewedCount: 2,
                    xpEarned: 0,
                })
                const row = await entityManager.findOneByOrFail(FlashcardDueReviewSessionEntity,
                    {
                        id: sessionId,
                    })
                expect(row.status).toBe("completed")
                expect(row.reviewedCount).toBe(2)
            })
    })
