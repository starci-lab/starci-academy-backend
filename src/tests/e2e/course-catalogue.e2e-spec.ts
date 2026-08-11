import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    CourseHandler,
} from "@features/api/core/graphql/queries/courses/course/course.handler"
import {
    CourseResolver,
} from "@features/api/core/graphql/queries/courses/course/course.resolver"
import {
    CourseService,
} from "@features/api/core/graphql/queries/courses/course/course.service"
import {
    CourseSuggestionsHandler,
} from "@features/api/core/graphql/queries/courses/course-suggestions/course-suggestions.handler"
import {
    CourseSuggestionsResolver,
} from "@features/api/core/graphql/queries/courses/course-suggestions/course-suggestions.resolver"
import {
    CourseSuggestionsService,
} from "@features/api/core/graphql/queries/courses/course-suggestions/course-suggestions.service"
import {
    CoursesHandler,
} from "@features/api/core/graphql/queries/courses/courses/courses.handler"
import {
    CoursesResolver,
} from "@features/api/core/graphql/queries/courses/courses/courses.resolver"
import {
    CoursesService,
} from "@features/api/core/graphql/queries/courses/courses/courses.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/** A visitor searches the catalogue, accepts a suggestion, and opens its course. */
describe("a visitor finds a course and opens its public catalogue entry",
    () => {
        const course = {
            id: "10000000-0000-4000-8000-000000000001",
            title: "System Design Mastery",
            displayId: "system-design-mastery",
            description: "Design reliable distributed systems.",
        } as CourseEntity
        const elasticsearch = {
            indicateName: jest.fn(() => "courses-en"),
            client: {
                search: jest.fn(async (query: Record<string, unknown>) => {
                    if ("suggest" in query) {
                        return {
                            suggest: {
                                items: [
                                    {
                                        options: [
                                            {
                                                _id: course.id,
                                                text: course.title,
                                            },
                                        ],
                                    },
                                ],
                            },
                        }
                    }
                    return {
                        hits: {
                            total: {
                                value: 1,
                            },
                            hits: [
                                {
                                    _source: course,
                                },
                            ],
                        },
                    }
                }),
            },
        }
        const s3ReadService = {
            json: jest.fn().mockResolvedValue(course),
        }
        let app: INestApplication

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
                    CoursesResolver,
                    CoursesService,
                    CoursesHandler,
                    CourseSuggestionsResolver,
                    CourseSuggestionsService,
                    CourseSuggestionsHandler,
                    CourseResolver,
                    CourseService,
                    CourseHandler,
                    S3NameResolverService,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: CourseStatsProjectionService,
                        useValue: {
                            getStats: jest.fn().mockResolvedValue({
                                enrollmentCount: 0,
                            }),
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue({
                    canActivate: () => true,
                })
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        it("keeps search, typeahead, and detail on the same localized identity",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("x-locale",
                        Locale.En)
                    .send({
                        query: `
                            query CatalogueFlow {
                                courses(request: {
                                    filters: {
                                        search: "system"
                                        pageNumber: 0
                                        limit: 10
                                    }
                                }) {
                                    success
                                    data {
                                        count
                                        data {
                                            id
                                            title
                                            displayId
                                            description
                                        }
                                    }
                                }
                                courseSuggestions(request: {
                                    query: "sys"
                                    limit: 5
                                }) {
                                    success
                                    data {
                                        data {
                                            id
                                            label
                                        }
                                    }
                                }
                                course(request: {
                                    displayId: "system-design-mastery"
                                }) {
                                    success
                                    data {
                                        id
                                        title
                                        displayId
                                        description
                                    }
                                }
                            }
                        `,
                    })

                expect(response.body.errors).toBeUndefined()
                const catalogue = response.body.data
                expect(catalogue.courses.data).toEqual({
                    count: 1,
                    data: [
                        expect.objectContaining({
                            id: course.id,
                            displayId: course.displayId,
                        }),
                    ],
                })
                expect(catalogue.courseSuggestions.data.data).toEqual([
                    {
                        id: course.id,
                        label: course.title,
                    },
                ])
                expect(catalogue.course.data).toMatchObject({
                    id: course.id,
                    title: course.title,
                    displayId: course.displayId,
                })
                expect(elasticsearch.indicateName).toHaveBeenCalledWith({
                    entity: CourseEntity.name,
                    locale: Locale.En,
                })
                expect(s3ReadService.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: `courses/${course.displayId}/${Locale.En}.json`,
                    }),
                )
            })
    })
