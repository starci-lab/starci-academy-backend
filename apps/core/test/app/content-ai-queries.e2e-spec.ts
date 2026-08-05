import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
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
    ApolloServerType,
} from "@modules/api"
import {
    ContentAiMessageEntity,
    ContentAiSessionEntity,
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    Locale,
    ModuleEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    CourseRagRetrievalService,
} from "@modules/rag"
import {
    CacheService,
} from "@modules/cache"
import {
    ContentAiService,
} from "@modules/bussiness"
import {
    UserService,
} from "@modules/bussiness"
import {
    ContentAiSessionsResolver,
} from "@features/api/core/graphql/queries/contents/content-ai-sessions/content-ai-sessions.resolver"
import {
    ContentAiHistoryResolver,
} from "@features/api/core/graphql/queries/contents/content-ai-history/content-ai-history.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the content-AI READ surface -- `contentAiSessions` (list) and
 * `contentAiSessionMessages` (saved turns) -- over REAL HTTP + REAL Postgres
 * (Testcontainers). `content-ai-session.e2e-spec.ts` covers the mutations
 * (create/delete/rename/archive/touch) and the write-side IDOR regression;
 * this file is the matching read-side coverage neither that spec nor
 * `content-ai-entitlement.e2e-spec.ts` exercises.
 *
 * MOCKED: nothing outbound -- both queries are pure Postgres reads
 * (`ContentAiService.sessions` / `loadSessionMessages`), no S3/RAG/model call
 * on this path.
 *
 * REAL: Postgres (Testcontainers), `ContentAiService` (the exact read methods
 * under test), `UserService`, the full GraphQL/Apollo wiring
 * (`ApolloServerModule`) and `GraphQLTransformInterceptor`, and
 * `KeycloakAuthGraphQLGuard` -- overridden only to stamp `request.user` with
 * whichever fake user the test "logs in" as (no Keycloak server here).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Content-AI read queries — contentAiSessions / contentAiSessionMessages (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        /** Fixture ids shared by every test (seeded once -- read-only material). */
        let course: CourseEntity
        let content: ContentEntity

        // ContentAiService's constructor deps beyond the entityManager/UserService
        // under test here -- neither read query (`sessions` / `loadSessionMessages`)
        // touches S3 or RAG, but Nest still needs these to resolve at compile time.
        const s3ReadServiceMock = {
            json: jest.fn(),
        }
        const contentRagMock = {
            retrieveContentExcerpt: jest.fn(),
            retrieveCourseExcerpt: jest.fn(),
        }
        // UserService.checkEnrollment's only cache layer -- always miss, so the
        // ownership scoping hits real Postgres every time
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const SESSIONS_QUERY = `
            query Sessions($request: ContentAiSessionsRequest!) {
                contentAiSessions(request: $request) {
                    success
                    error
                    data {
                        sessions {
                            id
                            title
                            messageCount
                            scope
                            originContentId
                        }
                    }
                }
            }
        `
        const MESSAGES_QUERY = `
            query Messages($request: ContentAiHistoryRequest!) {
                contentAiSessionMessages(request: $request) {
                    success
                    error
                    data {
                        messages {
                            role
                            content
                        }
                    }
                }
            }
        `

        const gql = (query: string, request_: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: request_,
                    },
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the two query resolvers under test
                    ContentAiSessionsResolver,
                    ContentAiHistoryResolver,
                    // REAL -- sessions()/loadSessionMessages() run real SQL
                    ContentAiService,
                    // REAL -- resolveEnrollmentId/checkEnrollment run real SQL
                    UserService,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadServiceMock,
                    },
                    // real class, no external deps -- safe to use as-is
                    S3NameResolverService,
                    {
                        provide: CourseRagRetrievalService,
                        useValue: contentRagMock,
                    },
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
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

            // seed the read-only course/content fixtures ONCE -- only users/
            // enrollments/sessions/messages are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-content-ai-queries-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-content-ai-queries-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Intro Lesson",
                        displayId: "intro-lesson-content-ai-queries-e2e",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // course/content fixtures (seeded in beforeAll) are read-only across the
            // whole suite. CASCADE also clears content_ai_messages via
            // content_ai_sessions.
            await entityManager.query(
                "TRUNCATE TABLE \"content_ai_messages\", \"content_ai_sessions\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
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

        /** Seed a REAL enrollment (`is_enrolled = true`) for (user, the fixture course). */
        const seedEnrollment = async (user: UserEntity): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )

        const seedSession = async (
            enrollment: EnrollmentEntity,
            title: string,
        ): Promise<ContentAiSessionEntity> =>
            entityManager.save(
                entityManager.create(ContentAiSessionEntity,
                    {
                        scope: "content",
                        enrollment,
                        originContent: content,
                        title,
                        archivedAt: null,
                    }),
            )

        const seedMessage = async (
            session: ContentAiSessionEntity,
            enrollment: EnrollmentEntity,
            role: "user" | "assistant",
            message: string,
        ): Promise<ContentAiMessageEntity> =>
            entityManager.save(
                entityManager.create(ContentAiMessageEntity,
                    {
                        session,
                        enrollment,
                        content,
                        role,
                        message,
                    }),
            )

        describe("contentAiSessions",
            () => {
                it("lists the caller's own conversations for the content, recency-first, with real messageCount",
                    async () => {
                        const user = await seedUser("kc-sessions-owner")
                        const enrollment = await seedEnrollment(user)
                        currentUser = user

                        const older = await seedSession(enrollment,
                            "About closures")
                        await seedMessage(older,
                            enrollment,
                            "user",
                            "What is a closure?")
                        await seedMessage(older,
                            enrollment,
                            "assistant",
                            "A closure is...")
                        // bump recency so `newer` sorts first -- updated_at defaults to
                        // creation time otherwise indistinguishable within the same tick
                        await entityManager.query(
                            "UPDATE content_ai_sessions SET updated_at = now() - interval '1 hour' WHERE id = $1",
                            [older.id],
                        )
                        const newer = await seedSession(enrollment,
                            "About promises")
                        await seedMessage(newer,
                            enrollment,
                            "user",
                            "What is a promise?")
                        await seedMessage(newer,
                            enrollment,
                            "assistant",
                            "A promise is...")

                        const response = await gql(SESSIONS_QUERY,
                            {
                                contentId: content.id,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentAiSessions
                        expect(body.success).toBe(true)
                        const sessions = body.data.sessions as Array<{
                            id: string
                            title: string
                            messageCount: number
                            scope: string
                            originContentId: string
                        }>
                        expect(sessions).toHaveLength(2)
                        // recency-first: `newer` (just bumped) before `older`
                        expect(sessions[0].id).toBe(newer.id)
                        expect(sessions[0].title).toBe("About promises")
                        expect(sessions[0].messageCount).toBe(2)
                        expect(sessions[0].scope).toBe("content")
                        expect(sessions[0].originContentId).toBe(content.id)
                        expect(sessions[1].id).toBe(older.id)
                    })

                it("a session with NO saved turns (created but never asked) is hidden from the list",
                    async () => {
                        const user = await seedUser("kc-sessions-empty")
                        const enrollment = await seedEnrollment(user)
                        currentUser = user

                        // created via the real service, exactly like createContentAiSession
                        // would -- no messages ever saved on it
                        await entityManager.save(
                            entityManager.create(ContentAiSessionEntity,
                                {
                                    scope: "content",
                                    enrollment,
                                    originContent: content,
                                    title: null,
                                    archivedAt: null,
                                }),
                        )

                        const response = await gql(SESSIONS_QUERY,
                            {
                                contentId: content.id,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentAiSessions
                        expect(body.success).toBe(true)
                        expect(body.data.sessions).toEqual([])
                    })

                it("never returns another learner's conversations for the same content — ownership is scoped by enrollment",
                    async () => {
                        const owner = await seedUser("kc-sessions-scope-owner")
                        const stranger = await seedUser("kc-sessions-scope-stranger")
                        const ownerEnrollment = await seedEnrollment(owner)
                        const ownerSession = await seedSession(ownerEnrollment,
                            "Owner's chat")
                        await seedMessage(ownerSession,
                            ownerEnrollment,
                            "user",
                            "hi")
                        await seedMessage(ownerSession,
                            ownerEnrollment,
                            "assistant",
                            "hello")

                        // the stranger has NO enrollment at all for this course
                        currentUser = stranger
                        const response = await gql(SESSIONS_QUERY,
                            {
                                contentId: content.id,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentAiSessions
                        expect(body.success).toBe(true)
                        expect(body.data.sessions).toEqual([])
                    })
            })

        describe("contentAiSessionMessages",
            () => {
                it("loads the owner's saved turns oldest-first",
                    async () => {
                        const user = await seedUser("kc-messages-owner")
                        const enrollment = await seedEnrollment(user)
                        currentUser = user
                        const session = await seedSession(enrollment,
                            "About closures")
                        await seedMessage(session,
                            enrollment,
                            "user",
                            "What is a closure?")
                        await seedMessage(session,
                            enrollment,
                            "assistant",
                            "A closure is a function bundled with its lexical scope.")

                        const response = await gql(MESSAGES_QUERY,
                            {
                                sessionId: session.id,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentAiSessionMessages
                        expect(body.success).toBe(true)
                        const messages = body.data.messages as Array<{ role: string, content: string }>
                        expect(messages).toHaveLength(2)
                        expect(messages[0]).toEqual({
                            role: "user",
                            content: "What is a closure?",
                        })
                        expect(messages[1]).toEqual({
                            role: "assistant",
                            content: "A closure is a function bundled with its lexical scope.",
                        })
                    })

                it("IDOR — a non-owner reading another learner's session gets an EMPTY history, not the real turns",
                    async () => {
                        const owner = await seedUser("kc-messages-idor-owner")
                        const attacker = await seedUser("kc-messages-idor-attacker")
                        const enrollment = await seedEnrollment(owner)
                        const session = await seedSession(enrollment,
                            "Private chat")
                        await seedMessage(session,
                            enrollment,
                            "user",
                            "secret question")
                        await seedMessage(session,
                            enrollment,
                            "assistant",
                            "secret answer")

                        currentUser = attacker
                        const response = await gql(MESSAGES_QUERY,
                            {
                                sessionId: session.id,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentAiSessionMessages
                        expect(body.success).toBe(true)
                        expect(body.data.messages).toEqual([])

                        // the owner still sees the real turns -- proves the empty result
                        // above is the ownership gate, not data loss
                        currentUser = owner
                        const ownerResponse = await gql(MESSAGES_QUERY,
                            {
                                sessionId: session.id,
                            })
                        expect(ownerResponse.body.data.contentAiSessionMessages.data.messages)
                            .toHaveLength(2)
                    })
            })
    })
