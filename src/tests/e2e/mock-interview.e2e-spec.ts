import {
    CommandBus,
} from "@nestjs/cqrs"
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
    FlashcardDeckReadService,
} from "@modules/bussiness/flashcard/flashcard-deck.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
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
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    StartMockInterviewSessionCommand,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.command"
import {
    StartMockInterviewSessionHandler,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.handler"
import {
    MockInterviewSessionDrawService,
} from "@features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session-draw.service"
import {
    SyncMockInterviewSessionTurnsCommand,
} from "@features/api/core/graphql/mutations/interview/sync-mock-interview-session-turns/sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsHandler,
} from "@features/api/core/graphql/mutations/interview/sync-mock-interview-session-turns/sync-mock-interview-session-turns.handler"
import {
    GradeMockInterviewSessionCommand,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.command"
import {
    GradeMockInterviewSessionHandler,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.handler"
import {
    MockInterviewGradingService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service"
import {
    MockInterviewGradePromptService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
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
        let commandBus: CommandBus
        let learner: UserEntity
        let course: CourseEntity
        let sessionId: string
        let promptId: string
        let promptTitle: string

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
                    StartMockInterviewSessionHandler,
                    SyncMockInterviewSessionTurnsHandler,
                    MockInterviewGradePromptService,
                    MockInterviewGradingService,
                    GradeMockInterviewSessionHandler,
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
            commandBus = world.app.get(CommandBus)
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
        })

        afterAll(async () => {
            await world?.close()
        })

        it("draws and persists a server-owned interview session",
            async () => {
                const started = await commandBus.execute(
                    new StartMockInterviewSessionCommand({
                        request: {
                            courseId: course.id,
                            level: "middle",
                            mode: "design",
                            name: "Architecture round",
                        },
                        user: learner,
                        locale: Locale.En,
                    }),
                )
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
                const synced = await commandBus.execute(
                    new SyncMockInterviewSessionTurnsCommand({
                        request: {
                            sessionId,
                            turns,
                            questionIndex: 0,
                            phaseIndex: 2,
                        },
                        user: learner,
                    }),
                )
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
                const grade = await commandBus.execute(
                    new GradeMockInterviewSessionCommand({
                        request: {
                            courseId: course.id,
                            promptId: "client-cannot-replace-server-prompt",
                            promptTitle: "Client supplied title",
                            level: "junior",
                            turns,
                            sessionId,
                        },
                        user: learner,
                        locale: Locale.En,
                    }),
                )
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
