import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
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
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
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

interface SearchResponseData {
    autocompleteGlobalSearch: {
        data: {
            courses: Array<{
                id: string
                displayId: string
                title: string
                texts: Array<string>
                path: string | null
                isEnrolled: boolean | null
                isFree: boolean | null
                parentPath: {
                    course?: {
                        id: string
                        displayId: string
                    }
                } | null
            }>
        }
    }
}

/** An enrolled learner searches the indexed catalog and receives a routable, state-aware hit. */
describe("an enrolled learner searches the learning catalog and opens the matched course",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let course: CourseEntity
        const cache = {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
        }
        const elasticsearch = {
            indicateName: jest.fn(() => "courses-en"),
            client: {
                search: jest.fn(),
            },
        }
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

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
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
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                    {
                        provide: CacheService,
                        useValue: cache,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue(optionalAuthGuard)
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            await entityManager.query(`TRUNCATE TABLE
                "enrollments",
                "users",
                "courses"
                RESTART IDENTITY CASCADE`)

            learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-global-search-flow",
                    }),
            )
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Distributed Systems",
                        displayId: "distributed-systems",
                        description: "Queues, consistency, and resilient services.",
                        originalPrice: 0,
                        defaultLocale: Locale.En,
                    }),
            )
            await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user: learner,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )
            elasticsearch.client.search.mockResolvedValue({
                hits: {
                    hits: [
                        {
                            _id: course.id,
                            _source: {
                                id: course.id,
                                displayId: course.displayId,
                                title: course.title,
                                description: course.description,
                            },
                            highlight: {
                                title: [
                                    "<em>Distributed</em> Systems",
                                ],
                            },
                        },
                    ],
                },
            })
            cache.get
                .mockResolvedValueOnce({
                    course: {
                        id: course.id,
                        displayId: course.displayId,
                    },
                })
                .mockResolvedValueOnce([
                    course.id,
                ])
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("returns the indexed course with its canonical route and persisted enrollment state",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query Search($request: AutocompleteGlobalSearchRequest!) {
                                autocompleteGlobalSearch(request: $request) {
                                    data {
                                        courses {
                                            id displayId title texts path isEnrolled isFree
                                            parentPath { course { id displayId } }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                query: "distributed",
                                entities: [
                                    "CourseEntity",
                                ],
                                size: 5,
                            },
                        },
                    })
                    .expect(200)
                expect(response.body.errors).toBeUndefined()
                const body = response.body.data as SearchResponseData
                expect(body.autocompleteGlobalSearch.data.courses).toEqual([
                    {
                        id: course.id,
                        displayId: course.displayId,
                        title: course.title,
                        texts: [
                            "... <em>Distributed</em> Systems ...",
                        ],
                        path: "/courses/distributed-systems",
                        isEnrolled: true,
                        isFree: true,
                        parentPath: {
                            course: {
                                id: course.id,
                                displayId: course.displayId,
                            },
                        },
                    },
                ])

                const enrollment = await entityManager.findOneByOrFail(
                    EnrollmentEntity,
                    {
                        user: {
                            id: learner.id,
                        },
                        course: {
                            id: course.id,
                        },
                    },
                )
                expect(enrollment.isEnrolled).toBe(true)
            })
    })
