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
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import request from "supertest"
import type {
    EntityManager,
} from "typeorm"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
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
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    AskContentAiHandler,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.handler"
import {
    AskContentAiResolver,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.resolver"
import {
    AskContentAiService,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"
const CREDIT_LIMIT = 10
const MODEL_COST = 6

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
 * Operational AI-credit flow over the production GraphQL door.
 *
 * Postgres and {@link AiEntitlementService} are real. Only external boundaries
 * are replaced: the model result, object storage, vector retrieval, cache and
 * authentication provider. The assertions read the subscription and ledger
 * consequences directly, because a successful GraphQL envelope alone cannot
 * prove that a paid model run was actually charged.
 */
describe("AI entitlement first-use and concurrent debit resilience (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let currentUser: UserEntity | null = null
        let content: ContentEntity

        const model = {
            run: jest.fn().mockResolvedValue({
                text: "A closure retains access to its lexical scope.",
                model: "e2e-paid-model",
                provider: ModelProvider.OpenAI,
                cost: MODEL_COST,
                promptTokens: 40,
                completionTokens: 20,
                attempts: 1,
            }),
        }

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                if (!currentUser) {
                    return false
                }
                gqlContext.req.user = currentUser
                return true
            },
        }

        const ask = () => request(app.getHttpServer())
            .post("/graphql")
            .send({
                query: ASK_CONTENT_AI_MUTATION,
                variables: {
                    request: {
                        contentId: content.id,
                        question: "How do closures work?",
                    },
                },
            })

        const seedLearner = async (keycloakId: string): Promise<UserEntity> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )
            await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course: content.module.course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )
            return user
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
                    AskContentAiResolver,
                    AskContentAiService,
                    AskContentAiHandler,
                    ContentAiService,
                    UserService,
                    AiEntitlementService,
                    DayjsService,
                    S3NameResolverService,
                    {
                        provide: AiInvokeService,
                        useValue: model,
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: CREDIT_LIMIT,
                                creditsPerWeek: CREDIT_LIMIT,
                                creditCost: MODEL_COST,
                            }),
                        },
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: [],
                                },
                            }),
                        },
                    },
                    {
                        provide: S3ReadService,
                        useValue: {
                            json: jest.fn().mockResolvedValue({
                                isPremium: false,
                                body: "Lesson body about lexical closures.",
                                bodies: [],
                            }),
                        },
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: {
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
                        },
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                            del: jest.fn().mockResolvedValue(undefined),
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

            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "AI Entitlement E2E",
                        displayId: "ai-entitlement-e2e",
                        description: "AI entitlement fixture",
                        originalPrice: 100_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Entitlement module",
                        displayId: "ai-entitlement-module-e2e",
                        description: "AI entitlement module fixture",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Closures",
                        displayId: "ai-entitlement-content-e2e",
                        body: "unused",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE credit_usage_histories, ai_subscriptions, enrollments, users RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        it("the first paid AI answer creates the entitlement and atomically debits both windows",
            async () => {
                currentUser = await seedLearner("ai-entitlement-first-use")

                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)

                const response = await ask()

                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.askContentAi.data.answer)
                    .toBe("A closure retains access to its lexical scope.")

                const subscription = await entityManager.findOneOrFail(
                    AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                        },
                    },
                )
                expect(subscription.credit5hUsed).toBe(MODEL_COST)
                expect(subscription.creditWeekUsed).toBe(MODEL_COST)

                const histories = await entityManager.find(
                    CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                        },
                    },
                )
                expect(histories).toHaveLength(1)
                expect(histories[0]).toMatchObject({
                    credits: MODEL_COST,
                    model: "e2e-paid-model",
                    provider: ModelProvider.OpenAI,
                    promptTokens: 40,
                    completionTokens: 20,
                    attempts: 1,
                })
            })

        it("two concurrent paid answers cannot spend beyond the locked allowance",
            async () => {
                currentUser = await seedLearner("ai-entitlement-concurrent")
                const now = new Date()
                await entityManager.save(
                    entityManager.create(AiSubscriptionEntity,
                        {
                            user: currentUser,
                            tier: null,
                            status: AiSubStatus.Active,
                            currentPeriodEnd: null,
                            autoRenew: false,
                            window5hResetAt: new Date(now.getTime() + 60_000),
                            windowWeekResetAt: new Date(now.getTime() + 60_000),
                            credit5hUsed: CREDIT_LIMIT - MODEL_COST,
                            creditWeekUsed: CREDIT_LIMIT - MODEL_COST,
                            bonusCredit5h: 0,
                            bonusCreditWeek: 0,
                            ceilOverrides: null,
                        }),
                )

                const responses = await Promise.all([
                    ask(),
                    ask(),
                ])

                const successful = responses.filter(
                    (response) => response.body.data?.askContentAi?.success === true,
                )
                const rejected = responses.filter(
                    (response) => response.body.data?.askContentAi?.success === false,
                )
                expect(successful).toHaveLength(1)
                expect(rejected).toHaveLength(1)
                expect(rejected[0].body.data.askContentAi.error)
                    .toBe("AI_QUOTA_EXHAUSTED_EXCEPTION")

                const subscription = await entityManager.findOneOrFail(
                    AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                        },
                    },
                )
                expect(subscription.credit5hUsed).toBe(CREDIT_LIMIT)
                expect(subscription.creditWeekUsed).toBe(CREDIT_LIMIT)
                expect(await entityManager.count(CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                        },
                    })).toBe(1)
            })
    })
