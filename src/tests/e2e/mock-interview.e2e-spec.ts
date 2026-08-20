import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness/flashcard/flashcard-deck.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    StartMockInterviewSessionHandler,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.handler"
import {
    StartMockInterviewSessionResolver,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.resolver"
import {
    StartMockInterviewSessionService,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.service"
import {
    MockInterviewSessionDrawService,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session-draw.service"
import {
    SyncMockInterviewSessionTurnsHandler,
} from "@features/api/core/graphql/mutations/interview/sync-mock-interview-session-turns/sync-mock-interview-session-turns.handler"
import {
    SyncMockInterviewSessionTurnsResolver,
} from "@features/api/core/graphql/mutations/interview/sync-mock-interview-session-turns/sync-mock-interview-session-turns.resolver"
import {
    SyncMockInterviewSessionTurnsService,
} from "@features/api/core/graphql/mutations/interview/sync-mock-interview-session-turns/sync-mock-interview-session-turns.service"
import {
    GradeMockInterviewSessionHandler,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.handler"
import {
    GradeMockInterviewSessionResolver,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.resolver"
import {
    GradeMockInterviewSessionService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.service"
import {
    MockInterviewGradingService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service"
import {
    MockInterviewGradePromptService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
import {
    GradeMockInterviewSessionParseService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-parse.service"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/** A learner runs a mock interview and receives a persisted grade. */
describe("a learner runs a mock interview and receives a grade",
    () => {
        let world: FlowWorld
        let learner: UserEntity
        let course: CourseEntity
        let sessionId: string
        let promptId: string
        let promptTitle: string

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const gql = async <T>(query: string, input: Record<string, unknown>): Promise<T> => {
            const response = await request(world.app.getHttpServer())
                .post("/graphql")
                .set("authorization",
                    "Bearer mock-interview-flow-token")
                .set("x-course-id",
                    course.id)
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

        const turns = [
            {
                role: "interviewer",
                phase: MockInterviewPhase.Requirements,
                content: "Design a reliable notification platform and clarify its requirements.",
            },
            {
                role: "candidate",
                phase: MockInterviewPhase.Requirements,
                content: "I would clarify delivery channels, user preferences, latency targets, throughput, ordering, retries, and regional availability before choosing storage and queues.",
            },
            {
                role: "candidate",
                phase: MockInterviewPhase.HighLevel,
                content: "The design uses an API, durable event log, preference service, channel workers, idempotency keys, dead-letter queues, observability, and replay tooling for recovery.",
            },
        ]

        beforeAll(async () => {
            world = await bootFlowWorld({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                modelAnswer: {
                    text: JSON.stringify({
                        overallScore: 84,
                        verdict: "pass",
                        phaseScores: [
                            {
                                phase: "requirements",
                                score: 18,
                                max: 20,
                            },
                            {
                                phase: "highLevel",
                                score: 17,
                                max: 20,
                            },
                        ],
                        attributeScores: [
                            {
                                key: "communication",
                                score: 85,
                            },
                            {
                                key: "structuredThinking",
                                score: 83,
                            },
                        ],
                        strengths: [
                            "Separated durable intake from channel delivery.",
                        ],
                        gaps: [
                            "Quantify capacity and storage estimates.",
                        ],
                        followUpQuestion: "How would replay preserve idempotency?",
                    }),
                },
                providers: [
                    UserService,
                    MockInterviewSessionDrawService,
                    StartMockInterviewSessionResolver,
                    StartMockInterviewSessionService,
                    StartMockInterviewSessionHandler,
                    SyncMockInterviewSessionTurnsResolver,
                    SyncMockInterviewSessionTurnsService,
                    SyncMockInterviewSessionTurnsHandler,
                    MockInterviewGradePromptService,
                    GradeMockInterviewSessionParseService,
                    MockInterviewGradingService,
                    GradeMockInterviewSessionResolver,
                    GradeMockInterviewSessionService,
                    GradeMockInterviewSessionHandler,
                    {
                        provide: KeycloakAuthGraphQLGuard,
                        useValue: fakeAuthGuard,
                    },
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                            verifyAccessToken: jest.fn().mockResolvedValue({
                                active: true,
                                sub: "kc-mock-interview-flow",
                            }),
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                            assertCurrent: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                            getCookie: jest.fn(() => "mock-session"),
                        },
                    },
                    {
                        provide: GraphQLMustEnrolledGuard,
                        useValue: {
                            canActivate: () => true,
                        },
                    },
                    {
                        provide: PersonalProjectProgressService,
                        useValue: {
                            getProgress: jest.fn(),
                        },
                    },
                    {
                        provide: FlashcardDeckReadService,
                        useValue: {
                        },
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: {
                            retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                                excerpt: "Use durable queues, idempotent consumers, and dead-letter handling.",
                                matchedContentIds: [],
                            }),
                        },
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: {
                            validate: jest.fn().mockResolvedValue({
                                gradingModel: undefined,
                                gradingProvider: undefined,
                            }),
                        },
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: {
                            assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
                            consume: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                            warn: jest.fn(),
                            error: jest.fn(),
                        },
                    },
                ],
            })
            await world.truncate(
                "mock_interview_attempts",
                "mock_interview_sessions",
                "enrollments",
                "users",
                "courses",
            )
            learner = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-mock-interview-flow",
                        email: "mock-interview@starci.test",
                        username: "mock-interview-learner",
                    }),
            )
            course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Distributed Systems",
                        displayId: "mock-interview-flow-course",
                        description: "A deterministic E2E fixture.",
                        originalPrice: 1_000_000,
                        defaultLocale: Locale.En,
                    }),
            )
            await world.entityManager.save(world.entityManager.create(EnrollmentEntity,
                {
                    user: learner,
                    course,
                    isEnrolled: true,
                    pricingPhase: PricingPhase.Regular,
                }))
        })

        afterAll(async () => {
            await world?.close()
        })

        it("draws and persists a server-owned interview session",
            async () => {
                const result = await gql<{
                    startMockInterviewSession: { data: {
                        sessionId: string
                        promptId: string
                        promptTitle: string
                    } }
                }>(`
                    mutation Start($request: StartMockInterviewSessionRequest!) {
                        startMockInterviewSession(request: $request) {
                            data { sessionId promptId promptTitle }
                        }
                    }
                `,
                {
                    courseId: course.id,
                    level: "middle",
                    mode: "design",
                    name: "Architecture round",
                })
                const started = result.startMockInterviewSession.data
                sessionId = started.sessionId
                promptId = started.promptId
                promptTitle = started.promptTitle

                const session = await world.entityManager.findOneByOrFail(
                    MockInterviewSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.status).toBe("in_progress")
                expect(session.name).toBe("Architecture round")
                expect(session.promptId).toBe(promptId)
            })

        it("syncs the transcript and resume position",
            async () => {
                const result = await gql<{
                    syncMockInterviewSessionTurns: { data: { success: boolean } }
                }>(`
                    mutation Sync($request: SyncMockInterviewSessionTurnsRequest!) {
                        syncMockInterviewSessionTurns(request: $request) {
                            data { success }
                        }
                    }
                `,
                {
                    sessionId,
                    turns,
                    questionIndex: 0,
                    phaseIndex: 2,
                })
                const synced = result.syncMockInterviewSessionTurns.data
                expect(synced.success).toBe(true)

                const session = await world.entityManager.findOneByOrFail(
                    MockInterviewSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.turns).toHaveLength(turns.length)
                expect(session.phaseIndex).toBe(2)
            })

        it("grades the trusted session, persists an attempt, and closes resume",
            async () => {
                const result = await gql<{
                    gradeMockInterviewSession: { data: {
                        overallScore: number
                        verdict: string
                    } }
                }>(`
                    mutation Grade($request: GradeMockInterviewSessionRequest!) {
                        gradeMockInterviewSession(request: $request) {
                            data { overallScore verdict }
                        }
                    }
                `,
                {
                    courseId: course.id,
                    promptId: "client-cannot-replace-server-prompt",
                    promptTitle: "Client supplied title",
                    level: "junior",
                    turns,
                    sessionId,
                })
                const grade = result.gradeMockInterviewSession.data
                expect(grade.overallScore).toBe(84)
                expect(grade.verdict).toBe("pass")

                const attempt = await world.entityManager.findOneByOrFail(
                    MockInterviewAttemptEntity,
                    {
                        sessionId,
                    },
                )
                expect(attempt.promptId).toBe(promptId)
                expect(attempt.promptTitle).toBe(promptTitle)
                expect(attempt.overallScore).toBe(84)

                const session = await world.entityManager.findOneByOrFail(
                    MockInterviewSessionEntity,
                    {
                        id: sessionId,
                    },
                )
                expect(session.status).toBe("completed")
            })
    })
