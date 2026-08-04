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
    ApolloServerType,
} from "@modules/api"
import {
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    ModelProvider,
    ModuleEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    CacheService,
} from "@modules/cache"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    CourseRagRetrievalService,
} from "@modules/rag"
import {
    AiEntitlementService,
    AiInvokeService,
} from "@modules/ai"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai"
import {
    UserService,
} from "@modules/bussiness/user"
import {
    AskContentAiHandler,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.handler"
import {
    AskContentAiResolver,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.resolver"
import {
    AskContentAiService,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai"
import {
    PingResolver,
} from "../helpers/ping-resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * SECURITY e2e for `askContentAi`: proves the per-scope entitlement gate holds
 * end-to-end over REAL HTTP + REAL Postgres (Testcontainers), not just at the
 * unit level (see `content-ai.service.spec.ts`'s "entitlement per scope" describe,
 * which mocks the DB entirely). Covers the full scope × entitlement matrix:
 *
 *   scope       | enrolled           | not enrolled
 *   ------------|--------------------|---------------------------------
 *   content     | 200 + answer       | BLOCKED (PremiumContentAiAccessDeniedException)
 *   task        | 200 + own material | 200, material NOT leaked (empty grounding)
 *   course      | 200 + course RAG   | 200, course RAG NOT leaked (empty grounding)
 *   foundation  | 200 + doc          | 200 + doc (global, no gate either way)
 *
 * MOCKED (no external infra available in this harness):
 *  - `S3ReadService` — real class talks to MinIO/DigitalOcean S3 clients; stubbed
 *    to hand back a canned lesson-body JSON keyed by contentId.
 *  - `CourseRagRetrievalService` — real class talks to Qdrant; stubbed to return
 *    a marker excerpt so the test can prove (by its PRESENCE/ABSENCE in the final
 *    answer) whether a scope's material reached the model.
 *  - `AiInvokeService.run` — real class calls the model balancer/providers.
 *    Stubbed to ECHO the system prompt it was given back as the "answer" — this
 *    is what lets the test assert on leakage: whatever grounding text made it
 *    into the system prompt shows up verbatim in the mutation's `data.answer`.
 *  - `AiEntitlementService.consume` — real class writes AI-credit ledger rows;
 *    stubbed to a no-op (billing is out of scope here).
 *  - `KeycloakAuthGraphQLGuard` — real class verifies a Keycloak JWT; overridden
 *    to just stamp `request.user` with whichever fake user the test "logs in" as
 *    (no Keycloak server in this harness) — this test is about entitlement, not
 *    authentication.
 *
 * REAL: Postgres (Testcontainers), `ContentAiService` (the gate under test),
 * `UserService.checkEnrollment` (real SQL against real `enrollments` rows), the
 * full GraphQL/Apollo wiring (`ApolloServerModule`, same as production), and the
 * `GraphQLTransformInterceptor` — so a thrown `PremiumContentAiAccessDeniedException`
 * is asserted exactly as the client actually receives it: HTTP 200 with
 * `{ success: false, error: "PREMIUM_CONTENT_AI_ACCESS_DENIED_EXCEPTION" }` (the
 * interceptor's `catchError` swallows the exception into the response body before
 * it ever becomes a GraphQL transport error — it never surfaces as a 403).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("askContentAi entitlement per scope (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        /** Overrides the real Keycloak JWT verification — no Keycloak server here.
         *  Always "authenticates" (this suite tests ENTITLEMENT, not auth) and
         *  stamps `request.user` with whatever `currentUser` the test set. */
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

        /** Fixture ids shared by every test (seeded once — read-only material). */
        let course: CourseEntity
        let premiumContent: ContentEntity
        let task: MilestoneTaskEntity
        const foundationId = "11111111-1111-4111-8111-111111111111"

        /** Marker bodies the mocked S3/RAG layers hand back — asserted for
         *  presence (leak) or absence (no leak) in the final answer. */
        const PREMIUM_BODY_MARKER = "PREMIUM_LESSON_BODY_MARKER"
        const TASK_EXCERPT_MARKER = "TASK_BRIEF_EXCERPT_MARKER"
        const COURSE_EXCERPT_MARKER = "COURSE_WIDE_EXCERPT_MARKER"
        const FOUNDATION_EXCERPT_MARKER = "FOUNDATION_DOC_EXCERPT_MARKER"

        // both default to the real service's own empty-degrade shape (never
        // undefined) — additive grounding calls `retrieveCourseExcerpt` for the
        // course-wide BASE layer on every request that resolves a course (content/
        // task/course scopes all resolve one), IN ADDITION to whichever
        // page-specific PAGE layer call applies — so both must resolve even in
        // describe blocks that only care about one of the two. Each scope's own
        // `beforeEach` below overrides whichever one it needs a specific marker on.
        const contentRagMock = {
            retrieveContentExcerpt: jest.fn().mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
            }),
            retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
            }),
        }
        const s3ReadServiceMock = {
            json: jest.fn(),
        }
        const aiInvokeServiceMock = {
            // ECHO the system prompt back as the "answer" — the whole point is to
            // observe, from the HTTP response alone, exactly what grounding text
            // reached the model (a real model response would make leak/no-leak
            // unobservable from outside).
            run: jest.fn(async ({ messages }: { messages: Array<{ content: unknown }> }) => ({
                text: String(messages[0]?.content ?? ""),
                model: "test-model",
                provider: ModelProvider.Local,
                cost: 0,
                promptTokens: 0,
                completionTokens: 0,
                attempts: 1,
            })),
        }
        const aiEntitlementServiceMock = {
            consume: jest.fn().mockResolvedValue(undefined),
        }
        // CacheService always misses → UserService.checkEnrollment hits real
        // Postgres every time (no stale cross-test cache to reason about).
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const ASK_CONTENT_AI_MUTATION = `
            mutation Ask($request: AskContentAiRequest!) {
                askContentAi(request: $request) {
                    success
                    message
                    error
                    data {
                        answer
                    }
                }
            }
        `

        /** POST the askContentAi mutation with the given request input. */
        const askContentAi = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: ASK_CONTENT_AI_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    // same GraphQL/Apollo wiring as production (formatError,
                    // GraphQLTransformInterceptor's success-shape stays realistic)
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    // real Postgres against the Testcontainers DB — no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // CommandBus + @CommandHandler discovery for AskContentAiHandler
                    CqrsModule,
                ],
                providers: [
                    // satisfies "Query root type must be provided" — this module
                    // registers only mutation resolvers, so the generated schema
                    // needs a no-op root `@Query` to pass validation at `app.init()`.
                    PingResolver,
                    AskContentAiResolver,
                    AskContentAiService,
                    AskContentAiHandler,
                    // REAL — this is the gate under test
                    ContentAiService,
                    // REAL — checkEnrollment runs real SQL against real `enrollments`
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadServiceMock,
                    },
                    // real class, no external deps — safe to use as-is
                    S3NameResolverService,
                    {
                        provide: CourseRagRetrievalService,
                        useValue: contentRagMock,
                    },
                    {
                        provide: AiInvokeService,
                        useValue: aiInvokeServiceMock,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementServiceMock,
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

            // seed the read-only course/content/task fixtures ONCE — only
            // `users`/`enrollments` are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            premiumContent = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Premium Lesson",
                        displayId: "premium-lesson-e2e",
                        // V1 scalar body is unused by the AI grounding path (MinIO is
                        // the real source — see s3ReadServiceMock below); kept short
                        // to satisfy the NOT NULL column.
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: true,
                        module: courseModule,
                    }),
            )
            const milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            task = await entityManager.save(
                entityManager.create(MilestoneTaskEntity,
                    {
                        defaultLocale: Locale.En,
                        milestone,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/enrollment state; course/content/task fixtures
            // (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
            aiEntitlementServiceMock.consume.mockResolvedValue(undefined)
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

        describe("content scope (premium, enrollment-gated)",
            () => {
                beforeEach(() => {
                    s3ReadServiceMock.json.mockResolvedValue({
                        id: premiumContent.id,
                        isPremium: true,
                        body: PREMIUM_BODY_MARKER,
                        bodies: [],
                    })
                })

                it("enrolled learner → 200 + answer grounded in the premium lesson body",
                    async () => {
                        currentUser = await seedUser("kc-content-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await askContentAi({
                            contentId: premiumContent.id,
                            question: "Explain this lesson",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        expect(body.data.answer).toContain(PREMIUM_BODY_MARKER)
                    })

                it("NOT enrolled learner → BLOCKED, no premium body ever reaches the model",
                    async () => {
                        currentUser = await seedUser("kc-content-not-enrolled")
                        // no enrollment row created — never enrolled

                        const response = await askContentAi({
                            contentId: premiumContent.id,
                            question: "Explain this lesson",
                        })

                        // GraphQLTransformInterceptor swallows the thrown exception into
                        // a `{success:false}` body — HTTP stays 200, never a raw 403
                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PREMIUM_CONTENT_AI_ACCESS_DENIED_EXCEPTION")
                        expect(body.data).toBeNull()
                        // the gate trips BEFORE the model is ever invoked — no leak path
                        expect(aiInvokeServiceMock.run).not.toHaveBeenCalled()
                    })
            })

        describe("task scope (capstone material, enrollment-gated, no-leak on deny)",
            () => {
                beforeEach(() => {
                    contentRagMock.retrieveContentExcerpt.mockResolvedValue({
                        excerpt: TASK_EXCERPT_MARKER,
                    })
                })

                it("enrolled learner → 200 + grounds on the task's own material",
                    async () => {
                        currentUser = await seedUser("kc-task-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await askContentAi({
                            taskId: task.id,
                            question: "What does this task need?",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        expect(body.data.answer).toContain(TASK_EXCERPT_MARKER)
                        expect(contentRagMock.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId: task.id,
                                query: "What does this task need?",
                            })
                    })

                it("NOT enrolled learner → 200, but the task brief is NEVER fetched/leaked",
                    async () => {
                        currentUser = await seedUser("kc-task-not-enrolled")
                        // no enrollment row created — never enrolled

                        const response = await askContentAi({
                            taskId: task.id,
                            question: "What does this task need?",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        // course-scope-style gate: unentitled → empty grounding, NOT an
                        // exception — the mutation still succeeds, just with no material
                        expect(body.success).toBe(true)
                        expect(body.data.answer).not.toContain(TASK_EXCERPT_MARKER)
                        // the brief was never even retrieved — the gate trips first
                        expect(contentRagMock.retrieveContentExcerpt).not.toHaveBeenCalled()
                    })
            })

        describe("course scope (course-wide RAG, enrollment-gated, no-leak on deny)",
            () => {
                beforeEach(() => {
                    contentRagMock.retrieveCourseExcerpt.mockResolvedValue({
                        excerpt: COURSE_EXCERPT_MARKER,
                    })
                })

                it("enrolled learner → 200 + grounds on course-wide RAG",
                    async () => {
                        currentUser = await seedUser("kc-course-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await askContentAi({
                            courseId: course.id,
                            question: "What does this course cover?",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        expect(body.data.answer).toContain(COURSE_EXCERPT_MARKER)
                    })

                it("NOT enrolled learner → 200, grounds on course-wide RAG with the PREMIUM lesson EXCLUDED (no-leak via excludeContentIds)",
                    async () => {
                        currentUser = await seedUser("kc-course-not-enrolled")
                        // no enrollment row — a TRIAL viewer. Additive grounding now gives them
                        // course-wide RAG MINUS premium lessons (`excludeContentIds`) instead of
                        // the old hard block: the no-leak guarantee moved from "never call RAG" to
                        // "call RAG but exclude every premium content id of the course".

                        const response = await askContentAi({
                            courseId: course.id,
                            question: "What does this course cover?",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        // course-wide RAG DOES run for a trial viewer now — but the premium lesson
                        // is passed in `excludeContentIds`, so it is filtered out of retrieval.
                        expect(contentRagMock.retrieveCourseExcerpt).toHaveBeenCalledWith(
                            expect.objectContaining({
                                excludeContentIds: expect.arrayContaining([premiumContent.id]),
                            }),
                        )
                        // the (non-premium) course-wide excerpt reaches the model; the premium
                        // lesson body never does.
                        expect(body.data.answer).toContain(COURSE_EXCERPT_MARKER)
                        expect(body.data.answer).not.toContain(PREMIUM_BODY_MARKER)
                    })
            })

        describe("foundation scope (global library, NEVER gated)",
            () => {
                beforeEach(() => {
                    contentRagMock.retrieveContentExcerpt.mockResolvedValue({
                        excerpt: FOUNDATION_EXCERPT_MARKER,
                    })
                })

                it("enrolled learner → 200 + grounds on the foundation doc",
                    async () => {
                        currentUser = await seedUser("kc-foundation-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await askContentAi({
                            foundationId,
                            question: "Explain this concept",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        expect(body.data.answer).toContain(FOUNDATION_EXCERPT_MARKER)
                    })

                it("NOT enrolled learner → STILL 200 + grounds on the foundation doc (global, no gate)",
                    async () => {
                        currentUser = await seedUser("kc-foundation-not-enrolled")
                        // no enrollment row at all — foundation must not care

                        const response = await askContentAi({
                            foundationId,
                            question: "Explain this concept",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.askContentAi
                        expect(body.success).toBe(true)
                        expect(body.data.answer).toContain(FOUNDATION_EXCERPT_MARKER)
                    })
            })
    })
