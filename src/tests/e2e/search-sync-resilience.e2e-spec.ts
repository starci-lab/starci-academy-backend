import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    Global,
    Module,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import request from "supertest"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CourseTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/course-translation.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
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
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    createMemoryCacheManagerProvider,
    createRedisCacheManagerProvider,
} from "@modules/integrations/cache/cache.providers"
import {
    RedisModule,
} from "@modules/lib/native/redis/redis.module"
import {
    RedisInstanceKey,
} from "@modules/lib/native/redis/enums/instance-key"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    createElasticsearchProvider,
} from "@modules/integrations/elasticsearch/elasticsearch.providers"
import {
    ElasticsearchCourseBuildService,
} from "@modules/init/synchronizers/elasticsearch-synchronizer/builder/course.service"
import {
    ReadinessWatcherFactoryService,
} from "@modules/lib/mixin/readiness-watcher-factory.service"
import {
    AsyncService,
} from "@modules/lib/mixin/async.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    AutocompleteGlobalSearchResolver,
} from "@features/api/core/graphql/queries/autocomplete/global-search/autocomplete-global-search.resolver"
import {
    AutocompleteGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/autocomplete-global-search.service"
import {
    ChallengeGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/challenge.service"
import {
    ContentGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/content.service"
import {
    CourseGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/course.service"
import {
    FlashcardDeckGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/flashcard-deck.service"
import {
    FoundationGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/foundation.service"
import {
    MilestoneGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/milestone.service"
import {
    MilestoneTaskGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/milestone-task.service"
import {
    ModuleGlobalSearchService,
} from "@features/api/core/graphql/queries/autocomplete/global-search/entities/module.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    winstonServiceMock,
} from "@tests/helpers/create-e2e-app"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

@Global()
@Module({
    providers: [
        winstonServiceMock,
        createSuperJsonServiceProvider(),
        ReadinessWatcherFactoryService,
        AsyncService,
        RetryService,
    ],
    exports: [
        WinstonService,
        SUPERJSON,
        ReadinessWatcherFactoryService,
        AsyncService,
        RetryService,
    ],
})
class SearchE2eDependenciesModule {}

interface SearchResponse {
    body: {
        data: {
            autocompleteGlobalSearch: {
                data: {
                    courses: Array<{
                        id: string
                        title: string
                        isEnrolled: boolean
                    }>
                }
            }
        }
    }
}

const pollUntil = async (
    predicate: () => Promise<boolean>,
    timeoutMs = 10_000,
): Promise<void> => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        if (await predicate()) {
            return
        }
        await new Promise<void>((resolve) => setImmediate(resolve))
    }
    throw new Error(`Condition was not met within ${timeoutMs}ms`)
}

/** Real Postgres materialization must become searchable through the real Elasticsearch transport. */
describe("search indexing and enrollment-cache resilience",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let elasticsearch: ElasticsearchService
        let courseBuilder: ElasticsearchCourseBuildService
        let userService: UserService
        let learner: UserEntity
        let course: CourseEntity

        const emptySearch = {
            execute: jest.fn().mockResolvedValue([]),
        }
        const optionalAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const search = async (): Promise<SearchResponse> => request(app.getHttpServer())
            .post("/graphql")
            .send({
                query: `
                    query Search($request: AutocompleteGlobalSearchRequest!) {
                        autocompleteGlobalSearch(request: $request) {
                            data { courses { id title isEnrolled } }
                        }
                    }
                `,
                variables: {
                    request: {
                        query: "Operational Elasticsearch",
                        entities: [CourseEntity.name],
                        size: 5,
                    },
                },
            }) as unknown as Promise<SearchResponse>

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    SearchE2eDependenciesModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: true,
                        withResolvers: true,
                    }),
                    RedisModule.register({
                        isGlobal: true,
                        instanceKeys: [RedisInstanceKey.Cache],
                    }),
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    createRedisCacheManagerProvider(),
                    createMemoryCacheManagerProvider(),
                    CacheService,
                    createElasticsearchProvider(),
                    ElasticsearchService,
                    ElasticsearchCourseBuildService,
                    UserService,
                    AutocompleteGlobalSearchResolver,
                    AutocompleteGlobalSearchService,
                    CourseGlobalSearchService,
                    {
                        provide: ModuleGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: ChallengeGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: ContentGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: FlashcardDeckGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: MilestoneGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: MilestoneTaskGlobalSearchService,
                        useValue: emptySearch,
                    },
                    {
                        provide: FoundationGlobalSearchService,
                        useValue: emptySearch,
                    },
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue(optionalAuthGuard)
                .compile()

            elasticsearch = moduleRef.get(ElasticsearchService)
            // This focused flow owns only the course indices. Production boot
            // ensures the entire catalog (~30 indices); suppress that broad
            // lifecycle sweep and invoke the same production mapping method
            // explicitly for the exact indices exercised below.
            jest.spyOn(elasticsearch,
                "onModuleInit").mockResolvedValue(undefined)
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            courseBuilder = app.get(ElasticsearchCourseBuildService)
            userService = app.get(UserService)

            for (const locale of Object.values(Locale)) {
                await elasticsearch.ensureIndexForEntity({
                    entity: CourseEntity.name,
                    locale,
                })
            }

            await entityManager.query(`TRUNCATE TABLE
                "enrollments",
                "users",
                "courses"
                RESTART IDENTITY CASCADE`)
            learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-search-sync-resilience",
                    }),
            )
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Operational Elasticsearch",
                        displayId: "operational-elasticsearch",
                        slug: "operational-elasticsearch",
                        description: "Production indexing and resilient search transport.",
                        originalPrice: 0,
                        defaultLocale: Locale.En,
                    }),
            )
            await entityManager.save([
                entityManager.create(CourseTranslationEntity,
                    {
                        courseId: course.id,
                        locale: Locale.En,
                        field: "title",
                        value: course.title,
                    }),
                entityManager.create(CourseTranslationEntity,
                    {
                        courseId: course.id,
                        locale: Locale.En,
                        field: "description",
                        value: course.description,
                    }),
            ])
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("indexes a Postgres course through the production builder and returns it over GraphQL",
            async () => {
                await courseBuilder.buildIndexById(course.id)
                const index = elasticsearch.indicateName({
                    entity: CourseEntity.name,
                    locale: Locale.En,
                })

                await pollUntil(async () => {
                    await elasticsearch.client.indices.refresh({
                        index,
                    })
                    const count = await elasticsearch.client.count({
                        index,
                        query: {
                            ids: {
                                values: [course.id],
                            },
                        },
                    })
                    return count.count === 1
                })

                const response = await search()
                expect(response.body.data.autocompleteGlobalSearch.data.courses)
                    .toEqual([
                        expect.objectContaining({
                            id: course.id,
                            title: course.title,
                            isEnrolled: false,
                        }),
                    ])
            })

        it("invalidates the real Redis enrollment set after enroll and refund state changes",
            async () => {
                const enrollment = await entityManager.save(
                    entityManager.create(EnrollmentEntity,
                        {
                            user: learner,
                            course,
                            pricingPhase: PricingPhase.Regular,
                            isEnrolled: true,
                        }),
                )
                await userService.invalidateEnrolledCourses(learner.id)

                const enrolled = await search()
                expect(enrolled.body.data.autocompleteGlobalSearch.data.courses[0]
                    .isEnrolled).toBe(true)

                enrollment.isEnrolled = false
                await entityManager.save(enrollment)
                await userService.invalidateEnrolledCourses(learner.id)

                const refunded = await search()
                expect(refunded.body.data.autocompleteGlobalSearch.data.courses[0]
                    .isEnrolled).toBe(false)
            })
    })
