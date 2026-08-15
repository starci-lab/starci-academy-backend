import request from "supertest"
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
    CodingDomainSummaryHandler,
} from "@features/api/core/graphql/queries/coding/coding-domain-summary/coding-domain-summary.handler"
import {
    CodingDomainSummaryResolver,
} from "@features/api/core/graphql/queries/coding/coding-domain-summary/coding-domain-summary.resolver"
import {
    CodingDomainSummaryService,
} from "@features/api/core/graphql/queries/coding/coding-domain-summary/coding-domain-summary.service"
import {
    CodingProblemsResolver,
} from "@features/api/core/graphql/queries/coding/coding-problems/coding-problems.resolver"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CodingProblemService,
} from "@modules/bussiness/coding/coding-problem.service"
import {
    CodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/**
 * The domain-grouping flow, walked the way a client walks it.
 *
 * WHAT THIS PROVES AND WHAT IT DOES NOT. It enters through the real GraphQL transport, so routing,
 * the guard, schema validation and serialization are all under test - the layers a unit spec starts
 * after. Elasticsearch is STUBBED, which is the convention this repository already uses for its
 * other index-backed reads (`course-discovery.e2e-spec.ts` does exactly this): the shape of the ES
 * request is proved in `coding-domain-summary.handler.spec.ts`, where it can be asserted precisely,
 * and proving it twice against a live index would make this suite depend on a synchronizer run.
 *
 * THE REFUSAL IS HALF THE POINT. A flow that only proves the authenticated path has proved the half
 * nobody doubted, so the last case sends no session and expects the door to close.
 */

/** One bucket as Elasticsearch returns it from a terms aggregation. */
interface DomainBucket {
    key: string
    doc_count: number
}

describe("a learner reads the catalog grouped by interview topic domain",
    () => {
        let app: INestApplication
        let learner: UserEntity
        let search: jest.Mock

        /** Program the next ES call to answer with these aggregation buckets. */
        const programBuckets = (buckets: Array<DomainBucket>): void => {
            search.mockResolvedValueOnce({
                aggregations: {
                    byDomain: {
                        buckets,
                    },
                },
            })
        }

        /** Program the next ES call to answer with this page of catalog hits. */
        const programHits = (
            sources: Array<Record<string, unknown>>,
            total: number,
        ): void => {
            search.mockResolvedValueOnce({
                hits: {
                    hits: sources.map((source) => ({
                        _source: source,
                    })),
                    total: {
                        value: total,
                    },
                },
            })
        }

        /** The ES request body the last call carried. */
        const lastBody = (): Record<string, unknown> =>
            search.mock.calls[search.mock.calls.length - 1][0] as Record<string, unknown>

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        beforeAll(async () => {
            learner = {
                id: "e2e-coding-domain-learner",
            } as UserEntity
            search = jest.fn()

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
                    CodingDomainSummaryResolver,
                    CodingDomainSummaryService,
                    CodingDomainSummaryHandler,
                    CodingProblemsResolver,
                    CodingProblemService,
                    {
                        provide: ElasticsearchService,
                        useValue: {
                            indicateName: jest.fn(() => "coding-problems-en"),
                            client: {
                                search,
                            },
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(authGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        beforeEach(() => {
            search.mockReset()
        })

        it("returns one bucket per domain that holds problems",
            async () => {
                programBuckets([
                    {
                        key: CodingDomain.Arrays,
                        doc_count: 12,
                    },
                    {
                        key: CodingDomain.SlidingWindow,
                        doc_count: 9,
                    },
                ])

                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query {
                                codingDomainSummary {
                                    success
                                    data {
                                        domains {
                                            domain
                                            total
                                        }
                                    }
                                }
                            }
                        `,
                    })

                expect(response.status).toBe(200)
                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.codingDomainSummary.success).toBe(true)
                expect(response.body.data.codingDomainSummary.data.domains).toEqual([
                    {
                        domain: CodingDomain.Arrays,
                        total: 12,
                    },
                    {
                        domain: CodingDomain.SlidingWindow,
                        total: 9,
                    },
                ])
            })

        it("narrows the catalog to one domain, and the total agrees with that domain's bucket",
            async () => {
                programHits([
                    {
                        id: "p1",
                        slug: "longest-substring",
                        title: "Longest Substring Without Repeating",
                        domain: CodingDomain.SlidingWindow,
                    },
                ],
                9)

                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query Problems($request: CodingProblemsRequest!) {
                                codingProblems(request: $request) {
                                    success
                                    data {
                                        total
                                        problems {
                                            id
                                            domain
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                domain: CodingDomain.SlidingWindow,
                            },
                        },
                    })

                expect(response.status).toBe(200)
                expect(response.body.errors).toBeUndefined()
                const payload = response.body.data.codingProblems.data
                expect(payload.total).toBe(9)
                expect(payload.problems).toHaveLength(1)
                expect(payload.problems[0].domain).toBe(CodingDomain.SlidingWindow)
                // the filter travelled the whole way down, alongside the enabled gate
                const filter = (lastBody().query as {
                    bool: { filter: Array<Record<string, unknown>> }
                }).bool.filter
                expect(filter).toContainEqual({
                    term: {
                        domain: CodingDomain.SlidingWindow,
                    },
                })
                expect(filter).toContainEqual({
                    term: {
                        enabled: true,
                    },
                })
            })

        it("is ADDITIVE: the same query without a domain returns the whole catalog",
            async () => {
                programHits([],
                    120)

                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query Problems($request: CodingProblemsRequest!) {
                                codingProblems(request: $request) {
                                    data {
                                        total
                                    }
                                }
                            }
                        `,
                        variables: {
                            request: {
                            },
                        },
                    })

                expect(response.status).toBe(200)
                expect(response.body.data.codingProblems.data.total).toBe(120)
                // nothing was narrowed: the enabled gate is the only clause
                const filter = (lastBody().query as {
                    bool: { filter: Array<Record<string, unknown>> }
                }).bool.filter
                expect(filter).toEqual([
                    {
                        term: {
                            enabled: true,
                        },
                    },
                ])
            })

        it("refuses a domain value the enum does not carry, at the door",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query Problems($request: CodingProblemsRequest!) {
                                codingProblems(request: $request) {
                                    data {
                                        total
                                    }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                domain: "notARealDomain",
                            },
                        },
                    })

                expect(response.body.errors).toBeDefined()
                // the schema refused it, so nothing reached Elasticsearch at all
                expect(search).not.toHaveBeenCalled()
            })
    })
