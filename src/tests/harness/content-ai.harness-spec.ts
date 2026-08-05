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
import type {
    AiRunParams,
    AiRunResult,
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
    generate,
    messagesToPrompt,
    judge,
    readVolumeDoc,
    volumeExists,
    PingResolver,
} from "@tests/helpers"
import type {
    HarnessTierName,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimum judge score a grounded answer must reach to count as passing. */
const PASS_SCORE = 60

/**
 * REAL lesson bodies from the `.volume` SSOT mount, grounding every judged
 * case in actual course material instead of a hand-written fixture -- mirrors
 * `cv-scoring.harness-spec.ts`. Paths are `bodies/<language-variant>` dirs so
 * `readVolumeDoc` reads the SAME markdown the app itself stuffs into
 * `content.body` for a snapshot-backed lesson (see
 * `ContentAiService.resolveBodyText`).
 */
const FRAMEWORK_LESSON_DIR = "courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript"
const INDEXING_LESSON_DIR = "courses/1-system-design-mastery/modules/1-database-fundamentals/contents/1-indexing-and-query-optimization/bodies/0-typescript"
/** A REAL isPremium:true lesson -- grounds the premium-gate case in an actual locked lesson. */
const PREMIUM_LESSON_DIR = "courses/0-fullstack-mastery/modules/10-email-sms-otp/contents/0-sending-emails-with-nodemailer/bodies/0-typescript"

/** Skip the whole suite (with a clear message) when the SSOT mount is absent. */
const HAVE_VOLUME = volumeExists(FRAMEWORK_LESSON_DIR)
    && volumeExists(INDEXING_LESSON_DIR)
    && volumeExists(PREMIUM_LESSON_DIR)
const describeOrSkip = HAVE_VOLUME
    ? describe
    : describe.skip

/**
 * The tier the injected {@link AiInvokeService} routes THIS request's model
 * call to. Mutated by each `it` before it POSTs -- the analogue of `currentUser`
 * -- so a single adapter serves every case at its declared tier.
 */
let currentTier: HarnessTierName = "mid"

/**
 * When set, {@link harnessInvokeAdapter} throws instead of calling the model --
 * proves the `askContentAi` flow surfaces a real model failure as
 * `success: false` rather than a false success. Reset in `afterEach` as a
 * safety net; the one `it` that sets it also resets it in a `finally`.
 */
let forceModelError = false

/**
 * Harness-backed {@link AiInvokeService} stand-in. It keeps the app's real
 * `run(...)` CONTRACT but swaps the balancer/key-pool transport for the
 * harness's tiered Anthropic client (authenticated from `.secrets`) -- so the
 * grounded prompt the handler built is answered by a REAL Claude model at the
 * per-case tier, and the answer under judgement is a real model answer, not a
 * canned marker. Billing metadata is filled with zero-cost placeholders (credit
 * consumption is covered by `content-ai-entitlement.e2e-spec.ts`, and mocked
 * here). When {@link forceModelError} is set, throws instead -- the model-error
 * harness case.
 */
const harnessInvokeAdapter: Pick<AiInvokeService, "run"> = {
    run: async (
        {
            messages,
        }: AiRunParams,
    ): Promise<AiRunResult> => {
        if (forceModelError) {
            throw new Error("harness: forced model failure (model-error-path case)")
        }

        const {
            system,
            prompt,
        } = messagesToPrompt(messages)

        const text = await generate(currentTier,
            {
                prompt,
                ...(system
                    ? {
                        system,
                    }
                    : {
                    }),
            })

        return {
            text,
            model: `harness:${currentTier}`,
            provider: ModelProvider.Anthropic,
            attempts: 1,
            cost: 0,
            promptTokens: 0,
            completionTokens: 0,
        }
    },
}

/**
 * A REAL verbatim passage lifted from {@link FRAMEWORK_LESSON_DIR}'s English
 * body -- used by the "quoted passage" case to prove the `<display>`/`<context>`
 * wrapping (baked into every scope's system prompt -- see
 * `ContentAiService.buildScopePromptLines`) is honoured against real material.
 */
const FRAMEWORK_LESSON_QUOTE = "hand-rolling `new` hard-wires the consumer to a concrete implementation, every service spins up its own copy (losing sharing), and as the dependency graph grows the startup order becomes fragile and tests get locked to real objects."

/**
 * One judged `askContentAi` case driven through session-create -> ask ->
 * saveTurn -> assert-persisted -> judge (the full session-based flow).
 * `anchored: true` uses the shared `content` fixture (scope resolves to
 * `"content"`, grounded via the real lesson body at `dir`/`docLocale`);
 * `anchored: false` sends no anchor at all (scope resolves to `"global"`, the
 * additive base/app-wide path -- no lesson to ground on).
 */
interface JudgedCase {
    /** Human-readable label for the jest row title. */
    name: string
    /** Tier the injected invoker routes this case's model call to. */
    tier: HarnessTierName
    /** `true` = content scope (the shared fixture lesson); `false` = anchorless global scope. */
    anchored: boolean
    /** `.volume` dir to ground on (ignored when `anchored` is `false`). */
    dir: string | null
    /** Which locale file to read the real body from. */
    docLocale: "en" | "vi"
    /** Locale sent on the request (`x-locale` header) -- also what the judge expects the reply in. */
    requestLocale: Locale
    /** The learner's question (may be `<display>`/`<context>`-wrapped for the quote case). */
    question: string
    /** Grading criteria the answer must satisfy. */
    rubric: string
}

const CONTENT_SCOPE_CASES: Array<JudgedCase> = [
    {
        name: "content scope — indexing lesson trade-off (grounded, real .volume body)",
        tier: "mid",
        anchored: true,
        dir: INDEXING_LESSON_DIR,
        docLocale: "en",
        requestLocale: Locale.En,
        question: "Why would I add an index to a column, and what is the downside, based on this lesson?",
        rubric: [
            "The answer states at least one correct benefit of adding an index (faster reads / lookups, avoiding",
            "a full sequential scan) AND at least one correct downside (slower writes/inserts/updates because the",
            "index must be maintained, and/or extra storage). Pass only if both a benefit and a downside are",
            "given and are technically correct.",
        ].join(" "),
    },
    {
        name: "content scope — frameworks/DI lesson (grounded, real .volume body)",
        tier: "low",
        anchored: true,
        dir: FRAMEWORK_LESSON_DIR,
        docLocale: "en",
        requestLocale: Locale.En,
        question: "According to this lesson, what problem does dependency injection solve when one service depends on another?",
        rubric: [
            "The answer correctly explains that dependency injection avoids manually instantiating (`new`-ing) a",
            "dependency inside the consumer, which otherwise hard-wires the consumer to one concrete",
            "implementation and makes sharing a single instance / testing harder. Pass if the explanation",
            "captures the coupling/testability problem DI solves.",
        ].join(" "),
    },
    {
        name: "content scope — quoted passage (<display>/<context> wrap, frameworks/DI lesson)",
        tier: "high",
        anchored: true,
        dir: FRAMEWORK_LESSON_DIR,
        docLocale: "en",
        requestLocale: Locale.En,
        question: `<display>Why is this described as a problem?</display>\n<context>${FRAMEWORK_LESSON_QUOTE}</context>`,
        rubric: [
            "The answer explains why manually `new`-ing a dependency is a problem: it hard-wires the consumer to",
            "one concrete implementation, prevents sharing a single instance across services, and makes the",
            "startup order fragile / tests locked to real objects. The answer must address THIS specific point",
            "(not a generic unrelated reply) and must NOT repeat, quote back, or mention the <display> or",
            "<context> tags themselves. Pass only if both hold.",
        ].join(" "),
    },
    {
        name: "content scope — Vietnamese locale (frameworks/DI lesson, real .volume vi body)",
        tier: "mid",
        anchored: true,
        dir: FRAMEWORK_LESSON_DIR,
        docLocale: "vi",
        requestLocale: Locale.Vi,
        question: "Dependency injection giai quyet van de gi khi mot service phu thuoc vao service khac? Tra loi hoan toan bang tieng Viet.",
        rubric: [
            "The answer is written ENTIRELY in Vietnamese and correctly explains that dependency injection",
            "avoids manually creating (`new`) a dependency inside the consumer, which otherwise hard-wires it to",
            "one concrete implementation and makes sharing / testing harder. Pass ONLY if the response is in",
            "Vietnamese AND the explanation is correct.",
        ].join(" "),
    },
    {
        name: "global scope — anchorless app-wide chat (additive base path, no lesson)",
        tier: "low",
        anchored: false,
        dir: null,
        docLocale: "en",
        requestLocale: Locale.En,
        question: "What is the difference between an array and a linked list?",
        rubric: [
            "The answer correctly explains at least one real difference between an array and a linked list (e.g.",
            "contiguous memory + O(1) indexed access for arrays vs nodes/pointers + O(1) insertion/removal at a",
            "known position but O(n) traversal for linked lists). Pass if the explanation is technically",
            "correct, even though no specific course lesson is referenced.",
        ].join(" "),
    },
]

/**
 * FULL e2e harness for the content-AI query flow, grounded in REAL `.volume`
 * lesson material and graded by tiered AI judges.
 *
 * Drives the REAL `askContentAi` GraphQL mutation over HTTP against REAL
 * Postgres (the shared Testcontainers stack booted by `setup.ts`): the resolver,
 * `AskContentAiHandler`, `ContentAiService.prepareMessages` grounding (scope
 * derivation, the additive base/global path, the `<display>`/`<context>` quote
 * contract, the premium gate), and `UserService` all run exactly as production
 * wires them. The ONE swap is the model transport -- {@link AiInvokeService} is
 * replaced with {@link harnessInvokeAdapter}, which answers the grounded prompt
 * with a real Claude model at the per-case tier ({@link generate}, authenticated
 * from `.secrets`) instead of the app's balancer/key-pool. Each answer is then
 * graded by the independent Opus {@link judge}. This is a true e2e (real app
 * path + DB) whose acceptance criterion is an AI verdict rather than an exact
 * string.
 *
 * Cases covered:
 *  - {@link CONTENT_SCOPE_CASES}: content-scope grounded answers (2 REAL
 *    lessons across different topics), a `<display>`/`<context>`-quoted
 *    passage, a Vietnamese-locale answer, and the anchorless GLOBAL/base scope.
 *  - a premium lesson blocked for a NON-enrolled learner (no answer judged --
 *    the gate itself is the assertion).
 *  - a forced model failure surfacing as `success: false`, not a false success.
 *
 * MOCKED (no external infra in this lane, mirrors `content-ai-session.e2e-spec.ts`):
 *  - `S3ReadService` -- hands back the per-case REAL lesson body (from `.volume`)
 *    instead of MinIO.
 *  - `CourseRagRetrievalService` -- Qdrant; every real body here exceeds the
 *    stuff-whole threshold, so grounding falls back through the (mocked-empty)
 *    RAG excerpt to the full real body -- see `ContentAiService.resolveGrounding`.
 *  - `CacheService` -- no-op.
 *  - `AiEntitlementService.consume` -- credit ledger, out of scope here.
 *  - `AiInvokeService` -- replaced by the harness-backed adapter (the point of the harness).
 *  - `KeycloakAuthGraphQLGuard` -- stamps `request.user` with the fake caller.
 *
 * REAL: Postgres (Testcontainers), the full Apollo/GraphQL wiring, the resolver +
 * handler + `ContentAiService` grounding (every scope branch, the premium gate,
 * the additive base layer), `UserService`, and the model answer (a real Claude
 * call at the per-case tier) under judgement.
 *
 * Requires Docker (shared stack), the `.volume` SSOT mount, AND a Claude Code
 * OAuth token (`.secrets/claude-code-token.txt` or `CLAUDE_CODE_OAUTH_TOKEN`)
 * for live model + judge calls.
 */
describeOrSkip("Content-AI query — full e2e flow grounded in real .volume lessons, graded by tiered AI judges (harness)",
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

        /** Real service -- session create + turn persistence (the session-based flow). */
        let contentAiService: ContentAiService

        /** Read-only course/content fixtures seeded once in `beforeAll`. */
        let course: CourseEntity
        let content: ContentEntity
        /** A REAL isPremium:true lesson -- used only by the premium-gate case. */
        let premiumContent: ContentEntity

        const s3ReadServiceMock = {
            json: jest.fn(),
        }
        const contentRagMock = {
            retrieveContentExcerpt: jest.fn().mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
            }),
            retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
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

        const ASK_CONTENT_AI_MUTATION = `
            mutation Ask($request: AskContentAiRequest!) {
                askContentAi(request: $request) {
                    success
                    error
                    data { answer }
                }
            }
        `

        /**
         * POST a GraphQL mutation with a single `$request` variable. `locale`, when
         * given, is sent as the `x-locale` header `resolveLocale` reads (see
         * `getLocaleFromCookie`) -- the ONLY way to steer `@GraphQLLocale()` from an
         * HTTP client.
         */
        const gql = (
            query: string,
            input: Record<string, unknown>,
            locale?: Locale,
        ) => {
            const req = request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
            return (locale
                ? req.set("x-locale",
                    locale)
                : req
            ).send({
                query,
                variables: {
                    request: input,
                },
            })
        }

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
                    // no-op root @Query so the mutation-only schema validates at init
                    PingResolver,
                    AskContentAiResolver,
                    AskContentAiService,
                    AskContentAiHandler,
                    // REAL -- the grounding path (prepareMessages) under test
                    ContentAiService,
                    // REAL -- resolveEnrollmentId/checkEnrollment run real SQL
                    UserService,
                    // real class, no external deps -- safe as-is
                    S3NameResolverService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadServiceMock,
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: contentRagMock,
                    },
                    // THE swap: real balancer/key-pool transport -> harness tiered client
                    {
                        provide: AiInvokeService,
                        useValue: harnessInvokeAdapter,
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

            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fundamentals",
                        displayId: "fundamentals-content-ai-harness",
                        description: "harness fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-content-ai-harness",
                        description: "harness fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson",
                        displayId: "lesson-content-ai-harness",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
            // a REAL isPremium:true row so the premium-gate case exercises the actual
            // DB-sourced entitlement check in ContentAiService.resolveLessonGrounding
            premiumContent = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Premium Lesson",
                        displayId: "lesson-content-ai-harness-premium",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: true,
                        module: courseModule,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"content_ai_messages\", \"content_ai_sessions\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            currentTier = "mid"
            forceModelError = false
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            aiEntitlementServiceMock.consume.mockResolvedValue(undefined)
            contentRagMock.retrieveContentExcerpt.mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
            })
            contentRagMock.retrieveCourseExcerpt.mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
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

        /** Fetch a session's persisted turns, oldest first. */
        const loadTurns = (sessionId: string) =>
            entityManager.find(ContentAiMessageEntity,
                {
                    where: {
                        sessionId,
                    },
                    order: {
                        createdAt: "ASC",
                    },
                })

        // ── content-scope + quote + locale + global(base): each a real judged answer ──
        it.each(CONTENT_SCOPE_CASES)(
            "$name -> real askContentAi answer judged pass (tier=$tier)",
            async ({
                tier,
                anchored,
                dir,
                docLocale,
                requestLocale,
                question,
                rubric,
            }) => {
                const learner = await seedUser(`kc-content-ai-harness-${tier}-${Math.random().toString(36).slice(2,
                    10)}`)
                currentUser = learner
                currentTier = tier

                if (anchored) {
                    // content scope needs a real enrollment row (trial counts) for
                    // createSession's resolveEnrollmentId, regardless of premium status
                    await seedEnrollment(learner)

                    // ground on the REAL lesson body pulled from the .volume SSOT mount
                    const doc = readVolumeDoc(dir as string,
                        docLocale)
                    expect(doc.body.trim().length).toBeGreaterThan(0)
                    s3ReadServiceMock.json.mockResolvedValue({
                        id: content.id,
                        isPremium: false,
                        body: doc.body,
                        bodies: [],
                    })
                }

                // session-based: open the conversation up front (the unit the real
                // /content_ai gateway persists into), exactly like production. No
                // anchor at all -> resolves to the "global" (app-wide) scope.
                const sessionId = await contentAiService.createSession(
                    anchored
                        ? {
                            userId: learner.id,
                            contentId: content.id,
                        }
                        : {
                            userId: learner.id,
                        },
                )
                expect(sessionId).toBeTruthy()

                const asked = await gql(ASK_CONTENT_AI_MUTATION,
                    {
                        ...(anchored
                            ? {
                                contentId: content.id,
                            }
                            : {
                            }),
                        question,
                    },
                    requestLocale)

                expect(asked.status).toBe(200)
                const askedBody = asked.body.data.askContentAi
                expect(askedBody.success).toBe(true)
                const answer: string = askedBody.data.answer
                expect(answer.trim().length).toBeGreaterThan(0)

                // mirror the gateway's post-answer step: persist the turn into the session
                await contentAiService.saveTurn({
                    userId: learner.id,
                    sessionId: sessionId as string,
                    ...(anchored
                        ? {
                            contentId: content.id,
                        }
                        : {
                        }),
                    question,
                    answer,
                })

                // the conversation now holds the user + assistant turns (session-based proof)
                const turns = await loadTurns(sessionId as string)
                expect(turns).toHaveLength(2)
                expect(turns[0].role).toBe("user")
                expect(turns[1].role).toBe("assistant")
                expect(turns[1].message).toBe(answer)

                // finally, grade the real model answer against the rubric
                const verdict = await judge(rubric,
                    answer)

                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            },
        )

        // ── premium gate: a REAL isPremium:true lesson blocks a NON-enrolled learner ──
        it("blocks a REAL premium lesson for a NON-enrolled learner (no answer judged, no leaked body)",
            async () => {
                const learner = await seedUser("kc-content-ai-harness-premium-non-enrolled")
                currentUser = learner
                // deliberately NOT enrolled -- no seedEnrollment call

                const premiumBody = readVolumeDoc(PREMIUM_LESSON_DIR,
                    "en")
                expect(premiumBody.body.trim().length).toBeGreaterThan(0)
                s3ReadServiceMock.json.mockResolvedValue({
                    id: premiumContent.id,
                    isPremium: true,
                    body: premiumBody.body,
                    bodies: [],
                })

                const asked = await gql(ASK_CONTENT_AI_MUTATION,
                    {
                        contentId: premiumContent.id,
                        question: "What SMTP settings does this lesson use?",
                    })

                expect(asked.status).toBe(200)
                const askedBody = asked.body.data.askContentAi
                // the premium gate throws BEFORE any model call -> caught by
                // GraphQLTransformInterceptor as success:false, never a leaked answer
                expect(askedBody.success).toBe(false)
                expect(askedBody.error).toBe("PREMIUM_CONTENT_AI_ACCESS_DENIED_EXCEPTION")
                expect(askedBody.data?.answer).toBeFalsy()
            })

        // ── model-error path: a forced model failure surfaces as an error, not a false success ──
        it("surfaces a forced model failure as success:false rather than a false success",
            async () => {
                const learner = await seedUser("kc-content-ai-harness-model-error")
                await seedEnrollment(learner)
                currentUser = learner
                currentTier = "mid"

                const doc = readVolumeDoc(INDEXING_LESSON_DIR,
                    "en")
                s3ReadServiceMock.json.mockResolvedValue({
                    id: content.id,
                    isPremium: false,
                    body: doc.body,
                    bodies: [],
                })

                const sessionId = await contentAiService.createSession({
                    userId: learner.id,
                    contentId: content.id,
                })
                expect(sessionId).toBeTruthy()

                forceModelError = true
                try {
                    const asked = await gql(ASK_CONTENT_AI_MUTATION,
                        {
                            contentId: content.id,
                            question: "What is a B-tree index?",
                        })

                    expect(asked.status).toBe(200)
                    const askedBody = asked.body.data.askContentAi
                    expect(askedBody.success).toBe(false)
                    expect(askedBody.data?.answer).toBeFalsy()

                    // never reached the post-answer persistence step (no turn saved)
                    const turns = await loadTurns(sessionId as string)
                    expect(turns).toHaveLength(0)
                } finally {
                    forceModelError = false
                }
            })
    })
