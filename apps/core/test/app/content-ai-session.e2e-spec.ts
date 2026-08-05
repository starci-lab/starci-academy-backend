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
    ContentAiMessageEntity,
    ContentAiSessionEntity,
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    Locale,
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
} from "@modules/bussiness"
import {
    UserService,
} from "@modules/bussiness"
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
    CreateContentAiSessionResolver,
} from "@features/api/core/graphql/mutations/contents/create-content-ai-session/create-content-ai-session.resolver"
import {
    DeleteContentAiSessionResolver,
} from "@features/api/core/graphql/mutations/contents/delete-content-ai-session/delete-content-ai-session.resolver"
import {
    RenameContentAiSessionResolver,
} from "@features/api/core/graphql/mutations/contents/rename-content-ai-session/rename-content-ai-session.resolver"
import {
    SetContentAiSessionArchivedResolver,
} from "@features/api/core/graphql/mutations/contents/set-content-ai-session-archived/set-content-ai-session-archived.resolver"
import {
    TouchContentAiSessionResolver,
} from "@features/api/core/graphql/mutations/contents/touch-content-ai-session/touch-content-ai-session.resolver"
import {
    PingResolver,
} from "../helpers/ping-resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the content-AI session management mutations
 * (`createContentAiSession`, `askContentAi` + `saveTurn`, `deleteContentAiSession`
 * — renamed from `clearContentAiHistory` — `renameContentAiSession`,
 * `setContentAiSessionArchived`, `touchContentAiSession`) —
 * `.artifacts/states/content-ai/findings.md` round-1 IDOR fix — over REAL
 * HTTP + REAL Postgres (Testcontainers), not the mocked-DB unit level (see
 * `content-ai.service.spec.ts`).
 *
 * CRITICAL coverage: every mutating operation (`deleteSession`,
 * `renameContentAiSession`, `setContentAiSessionArchived`, `touchSession`)
 * carries the owner predicate (`enrollment.userId = caller OR session.userId =
 * caller`) IN THE WRITE ITSELF (the `WHERE` clause of the `DELETE`/`UPDATE`),
 * not just a preceding `SELECT` — so a non-owner's call is a silent no-op, never
 * a mutation. This spec seeds a session owned by user A, attempts each mutating
 * call as user B, and asserts the row survives untouched; then repeats as the
 * real owner and asserts the mutation lands. This is the regression test for
 * the round-1 IDOR class (`.artifacts/states/content-ai/findings.md`).
 *
 * `askContentAi` (the one-shot GraphQL mutation) never persists anything by
 * itself — persistence only happens when the caller (the `/content_ai` socket
 * gateway in production) separately calls `ContentAiService.saveTurn` after the
 * answer completes. This spec mirrors that exact two-step flow: mutation over
 * HTTP for the answer, then a direct `saveTurn` call (the real, DI-resolved
 * service instance) for the persistence — there is no dedicated GraphQL
 * mutation for "save a turn".
 *
 * MOCKED (no external infra available in this harness):
 *  - `S3ReadService` — real class talks to MinIO; stubbed to hand back a canned
 *    lesson body.
 *  - `CourseRagRetrievalService` — real class talks to Qdrant; stubbed (unused
 *    by the small-body/no-code grounding path this spec exercises).
 *  - `AiInvokeService.run` — real class calls the model balancer/providers;
 *    stubbed to return a canned answer.
 *  - `AiEntitlementService.consume` — real class writes AI-credit ledger rows;
 *    stubbed to a no-op (billing is out of scope here).
 *  - `KeycloakAuthGraphQLGuard` — overridden to stamp `request.user` with
 *    whichever fake user the test "logs in" as (no Keycloak server here).
 *
 * REAL: Postgres (Testcontainers), `ContentAiService` (the mutations under
 * test, including the owner-scoped SQL), `UserService`, the full GraphQL/
 * Apollo wiring (`ApolloServerModule`) and `GraphQLTransformInterceptor` — so
 * the "always success, silent no-op" response shape a non-owner sees is
 * asserted exactly as the client receives it.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Content-AI session mutations + owner-scoped-write IDOR (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let contentAiService: ContentAiService

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

        /** Fixture ids shared by every test (seeded once — read-only material). */
        let course: CourseEntity
        let content: ContentEntity

        const ANSWER_MARKER = "CONTENT_AI_ANSWER_MARKER"

        const s3ReadServiceMock = {
            json: jest.fn(),
        }
        // both default to the real service's own empty-degrade shape (never
        // undefined) — additive grounding calls `retrieveCourseExcerpt` for the
        // course-wide BASE layer on every request that resolves a course, in
        // addition to whichever page-specific PAGE layer call applies, so both
        // must resolve even when a test only cares about the page-level answer.
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
        const aiInvokeServiceMock = {
            run: jest.fn().mockResolvedValue({
                text: ANSWER_MARKER,
                model: "test-model",
                provider: ModelProvider.Local,
                cost: 0,
                promptTokens: 0,
                completionTokens: 0,
                attempts: 1,
            }),
        }
        const aiEntitlementServiceMock = {
            consume: jest.fn().mockResolvedValue(undefined),
        }
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const CREATE_SESSION_MUTATION = `
            mutation Create($request: CreateContentAiSessionRequest!) {
                createContentAiSession(request: $request) {
                    success
                    error
                    data { id }
                }
            }
        `
        const ASK_CONTENT_AI_MUTATION = `
            mutation Ask($request: AskContentAiRequest!) {
                askContentAi(request: $request) {
                    success
                    error
                    data { answer }
                }
            }
        `
        const DELETE_SESSION_MUTATION = `
            mutation Delete($request: DeleteContentAiSessionRequest!) {
                deleteContentAiSession(request: $request) {
                    success
                    error
                    data { cleared }
                }
            }
        `
        const RENAME_SESSION_MUTATION = `
            mutation Rename($request: RenameContentAiSessionRequest!) {
                renameContentAiSession(request: $request) {
                    success
                    error
                    data { renamed }
                }
            }
        `
        const SET_ARCHIVED_MUTATION = `
            mutation SetArchived($request: SetContentAiSessionArchivedRequest!) {
                setContentAiSessionArchived(request: $request) {
                    success
                    error
                    data { archived }
                }
            }
        `
        const TOUCH_SESSION_MUTATION = `
            mutation Touch($request: TouchContentAiSessionRequest!) {
                touchContentAiSession(request: $request) {
                    success
                    error
                    data { touched }
                }
            }
        `

        /** POST a GraphQL mutation with a single `$request` variable. */
        const gql = (query: string, input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: input,
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
                    // CommandBus + @CommandHandler discovery for AskContentAiHandler
                    CqrsModule,
                ],
                providers: [
                    // satisfies "Query root type must be provided" — this module
                    // registers only mutation resolvers, so the generated schema
                    // needs a no-op root `@Query` to pass validation at `app.init()`.
                    PingResolver,
                    CreateContentAiSessionResolver,
                    DeleteContentAiSessionResolver,
                    RenameContentAiSessionResolver,
                    SetContentAiSessionArchivedResolver,
                    TouchContentAiSessionResolver,
                    AskContentAiResolver,
                    AskContentAiService,
                    AskContentAiHandler,
                    // REAL — the mutations (incl. the owner-scoped SQL) under test
                    ContentAiService,
                    // REAL — resolveEnrollmentId/checkEnrollment run real SQL
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
            contentAiService = app.get(ContentAiService)

            // seed the read-only course/content fixtures ONCE — only users/
            // enrollments/sessions/messages are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-content-ai-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-content-ai-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Intro Lesson",
                        displayId: "intro-lesson-content-ai-e2e",
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
            // whole suite; everything else is per-test. CASCADE also clears
            // content_ai_sessions/content_ai_messages (both FK-reference users/
            // enrollments) even though they're listed explicitly for clarity.
            await entityManager.query(
                "TRUNCATE TABLE \"content_ai_messages\", \"content_ai_sessions\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
            aiEntitlementServiceMock.consume.mockResolvedValue(undefined)
            aiInvokeServiceMock.run.mockResolvedValue({
                text: ANSWER_MARKER,
                model: "test-model",
                provider: ModelProvider.Local,
                cost: 0,
                promptTokens: 0,
                completionTokens: 0,
                attempts: 1,
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

        /**
         * Seed a content-scope session directly (bypassing the `createContentAiSession`
         * mutation, whose happy path is covered separately) — owned via the
         * enrollment, exactly like a real lesson conversation.
         */
        const seedEnrollmentOwnedSession = async (
            enrollment: EnrollmentEntity,
            overrides: Partial<Pick<ContentAiSessionEntity, "title" | "archivedAt">> = {
            },
        ): Promise<ContentAiSessionEntity> =>
            entityManager.save(
                entityManager.create(ContentAiSessionEntity,
                    {
                        scope: "content",
                        enrollment,
                        originContent: content,
                        title: overrides.title ?? "Original title",
                        archivedAt: overrides.archivedAt ?? null,
                    }),
            )

        /**
         * Seed a foundation-scope session directly — owned via the raw `user`
         * column (the OTHER half of `resolveOwnedSession`'s ownership OR-clause,
         * `enrollment.userId = caller OR session.userId = caller`). No foundation
         * doc fixture is needed: `originFoundationId` is a nullable FK and this
         * spec never reads through it.
         */
        const seedUserOwnedSession = async (
            user: UserEntity,
            overrides: Partial<Pick<ContentAiSessionEntity, "title" | "archivedAt">> = {
            },
        ): Promise<ContentAiSessionEntity> =>
            entityManager.save(
                entityManager.create(ContentAiSessionEntity,
                    {
                        scope: "foundation",
                        user,
                        title: overrides.title ?? "Original title",
                        archivedAt: overrides.archivedAt ?? null,
                    }),
            )

        it("createContentAiSession → askContentAi → saveTurn (mirrors the socket gateway) persists a real session + turns; a one-shot ask alone stays ephemeral",
            async () => {
                const userA = await seedUser("kc-content-ai-owner")
                await seedEnrollment(userA)
                currentUser = userA

                const created = await gql(CREATE_SESSION_MUTATION,
                    {
                        contentId: content.id,
                    })
                expect(created.status).toBe(200)
                const sessionId: string | null = created.body.data.createContentAiSession.data.id
                expect(sessionId).toBeTruthy()

                const freshSession = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: sessionId as string,
                        },
                    })
                expect(freshSession.scope).toBe("content")
                expect(freshSession.enrollmentId).toBeTruthy()
                expect(freshSession.title).toBeNull()

                s3ReadServiceMock.json.mockResolvedValue({
                    id: content.id,
                    isPremium: false,
                    body: "Lesson body about closures.",
                    bodies: [],
                })
                const question = "What is a closure?"
                const asked = await gql(ASK_CONTENT_AI_MUTATION,
                    {
                        contentId: content.id,
                        question,
                    })
                expect(asked.status).toBe(200)
                const askedBody = asked.body.data.askContentAi
                expect(askedBody.success).toBe(true)
                expect(askedBody.data.answer).toBe(ANSWER_MARKER)

                // askContentAi alone never persists anything — the answer is ephemeral
                // unless the caller separately calls saveTurn (`.artifacts/states/
                // content-ai/business.md`: "An answer is ONLY persisted when sessionId
                // is supplied AND saveTurn succeeds").
                expect(await entityManager.count(ContentAiMessageEntity)).toBe(0)

                // mirror the `/content_ai` socket gateway's post-stream persistence step
                await contentAiService.saveTurn({
                    userId: userA.id,
                    sessionId: sessionId as string,
                    contentId: content.id,
                    question,
                    answer: askedBody.data.answer,
                })

                const turns = await entityManager.find(ContentAiMessageEntity,
                    {
                        where: {
                            sessionId: sessionId as string,
                        },
                        order: {
                            createdAt: "ASC",
                        },
                    })
                expect(turns).toHaveLength(2)
                expect(turns[0].role).toBe("user")
                expect(turns[0].message).toBe(question)
                expect(turns[0].contentId).toBe(content.id)
                expect(turns[0].enrollmentId).toBe(freshSession.enrollmentId)
                expect(turns[1].role).toBe("assistant")
                expect(turns[1].message).toBe(ANSWER_MARKER)

                // auto-titled from the first question on the first saved turn
                const titledSession = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: sessionId as string,
                        },
                    })
                expect(titledSession.title).toBe(question)
            })

        it("createContentAiSession with NO enrollment for the content's course → silent no-op: null id, no row persisted",
            async () => {
                // deliberately no seedEnrollment() call — the caller has never
                // touched this course at all
                currentUser = await seedUser("kc-content-ai-create-no-enrollment")

                const response = await gql(CREATE_SESSION_MUTATION,
                    {
                        contentId: content.id,
                    })

                expect(response.status).toBe(200)
                const body = response.body.data.createContentAiSession
                // createSession's contract: a missing anchor / enrollment resolves to
                // `null` (no row created) rather than throwing — the interceptor still
                // reports success (nothing errored), so `data.id` is the signal to check
                expect(body.success).toBe(true)
                expect(body.data.id).toBeNull()

                expect(await entityManager.count(ContentAiSessionEntity)).toBe(0)
            })

        it("IDOR — deleteContentAiSession as a non-owner is a silent no-op: the session survives; the real owner's delete removes it",
            async () => {
                const owner = await seedUser("kc-content-ai-delete-owner")
                const attacker = await seedUser("kc-content-ai-delete-attacker")
                const enrollment = await seedEnrollment(owner)
                const session = await seedEnrollmentOwnedSession(enrollment)

                currentUser = attacker
                const attackerAttempt = await gql(DELETE_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                    })
                expect(attackerAttempt.status).toBe(200)
                // the resolver's response shape claims success/cleared regardless of
                // whether a row was actually deleted (deleteSession is a silent
                // no-op) — asserted here exactly as-is, not as a bug: the DB row
                // below is the real proof of what happened.
                expect(attackerAttempt.body.data.deleteContentAiSession.success).toBe(true)

                const survived = await entityManager.findOne(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(survived).not.toBeNull()
                expect(survived?.title).toBe("Original title")

                currentUser = owner
                const ownerAttempt = await gql(DELETE_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                    })
                expect(ownerAttempt.status).toBe(200)
                expect(ownerAttempt.body.data.deleteContentAiSession.success).toBe(true)

                const gone = await entityManager.findOne(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(gone).toBeNull()
            })

        it("IDOR — renameContentAiSession as a non-owner leaves the title untouched; the real owner's rename lands",
            async () => {
                const owner = await seedUser("kc-content-ai-rename-owner")
                const attacker = await seedUser("kc-content-ai-rename-attacker")
                const enrollment = await seedEnrollment(owner)
                const session = await seedEnrollmentOwnedSession(enrollment)

                currentUser = attacker
                const attackerAttempt = await gql(RENAME_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                        title: "Renamed by attacker",
                    })
                expect(attackerAttempt.status).toBe(200)
                expect(attackerAttempt.body.data.renameContentAiSession.success).toBe(true)

                const untouched = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(untouched.title).toBe("Original title")

                currentUser = owner
                const ownerAttempt = await gql(RENAME_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                        title: "Renamed by owner",
                    })
                expect(ownerAttempt.status).toBe(200)
                expect(ownerAttempt.body.data.renameContentAiSession.success).toBe(true)

                const renamed = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(renamed.title).toBe("Renamed by owner")
            })

        it("IDOR — setContentAiSessionArchived as a non-owner leaves archivedAt untouched; the real owner's archive lands",
            async () => {
                const owner = await seedUser("kc-content-ai-archive-owner")
                const attacker = await seedUser("kc-content-ai-archive-attacker")
                const enrollment = await seedEnrollment(owner)
                const session = await seedEnrollmentOwnedSession(enrollment)
                expect(session.archivedAt).toBeNull()

                currentUser = attacker
                const attackerAttempt = await gql(SET_ARCHIVED_MUTATION,
                    {
                        sessionId: session.id,
                        archived: true,
                    })
                expect(attackerAttempt.status).toBe(200)
                expect(attackerAttempt.body.data.setContentAiSessionArchived.success).toBe(true)

                const untouched = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(untouched.archivedAt).toBeNull()

                currentUser = owner
                const ownerAttempt = await gql(SET_ARCHIVED_MUTATION,
                    {
                        sessionId: session.id,
                        archived: true,
                    })
                expect(ownerAttempt.status).toBe(200)
                expect(ownerAttempt.body.data.setContentAiSessionArchived.success).toBe(true)

                const archived = await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })
                expect(archived.archivedAt).not.toBeNull()
            })

        it("IDOR — touchContentAiSession as a non-owner does not bump recency; the real owner's touch does (covers the foundation/user-owned half of the ownership predicate)",
            async () => {
                const owner = await seedUser("kc-content-ai-touch-owner")
                const attacker = await seedUser("kc-content-ai-touch-attacker")
                // foundation scope: owned via session.userId, NOT enrollment.userId —
                // exercises the other side of `resolveOwnedSession`'s OR-clause
                const session = await seedUserOwnedSession(owner)
                const beforeAt = (await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })).updatedAt.getTime()

                currentUser = attacker
                const attackerAttempt = await gql(TOUCH_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                    })
                expect(attackerAttempt.status).toBe(200)
                expect(attackerAttempt.body.data.touchContentAiSession.success).toBe(true)

                const untouchedAt = (await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })).updatedAt.getTime()
                expect(untouchedAt).toBe(beforeAt)

                currentUser = owner
                const ownerAttempt = await gql(TOUCH_SESSION_MUTATION,
                    {
                        sessionId: session.id,
                    })
                expect(ownerAttempt.status).toBe(200)
                expect(ownerAttempt.body.data.touchContentAiSession.success).toBe(true)

                const touchedAt = (await entityManager.findOneOrFail(ContentAiSessionEntity,
                    {
                        where: {
                            id: session.id,
                        },
                    })).updatedAt.getTime()
                expect(touchedAt).toBeGreaterThan(beforeAt)
            })
    })
