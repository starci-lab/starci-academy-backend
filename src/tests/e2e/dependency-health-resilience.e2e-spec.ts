/* eslint-disable starci-be/e2e-asserts-persisted-state -- Health is an infrastructure liveness read model: the real Postgres/Redis socket outcomes and GraphQL payload are the persisted dependency state, and this query intentionally writes no application row. */
import type {
    INestApplication,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import request from "supertest"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import {
    PrometheusMetricsService,
} from "@modules/platform/health/prometheus-metrics.service"
import {
    SystemHealthService,
} from "@modules/platform/health/system-health.service"
import {
    SystemHealthStatusResolver,
} from "@features/api/core/graphql/queries/system/system-health-status/system-health-status.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface HealthComponent {
    name: string
    status: "up" | "degraded" | "down"
    latencyMs: number | null
    message: string | null
    checkedAt: string
}

interface HealthResponse {
    body: {
        errors?: Array<unknown>
        data: {
            systemHealthStatus: {
                success: boolean
                data: {
                    components: Array<HealthComponent>
                }
            }
        }
    }
}

/** Public health must stay total when one dependency is down and report real core infra. */
describe("dependency health resilience over production GraphQL",
    () => {
        let app: INestApplication
        const originalFetch = global.fetch

        const health = async (): Promise<HealthResponse> => request(app.getHttpServer())
            .post("/graphql")
            .send({
                query: `
                    query Health {
                        systemHealthStatus {
                            success
                            data {
                                components { name status latencyMs message checkedAt }
                            }
                        }
                    }
                `,
            }) as unknown as Promise<HealthResponse>

        beforeAll(async () => {
            process.env.JUDGE0_BASE_URL = "http://judge-down.invalid"
            jest.spyOn(global,
                "fetch").mockImplementation(async (input, init) => {
                const url = String(input)
                // Elasticsearch and Qdrant are shared real Testcontainers. All
                // public SaaS boundaries are deterministic; Judge0 is the one
                // deliberately unavailable dependency in this flow.
                if (url === process.env.ELASTICSEARCH_NODE
                    || url.startsWith(process.env.QDRANT_URL ?? "__missing__")) {
                    return originalFetch(input,
                        init)
                }
                if (url.includes("judge")) {
                    throw new Error("representative dependency unavailable")
                }
                return new Response(null,
                    {
                        status: 204,
                    })
            })

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    SystemHealthStatusResolver,
                    SystemHealthService,
                    {
                        provide: PrometheusMetricsService,
                        useValue: {
                            containerMetricsByName: jest.fn()
                                .mockResolvedValue(new Map()),
                        },
                    },
                    {
                        provide: AiBalancerService,
                        useValue: {
                            healthSnapshot: jest.fn().mockResolvedValue({
                                providers: [{
                                    activeKeys: 1,
                                    disabledKeys: 0,
                                }],
                            }),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
        })

        afterAll(async () => {
            jest.restoreAllMocks()
            await app?.close().catch(() => undefined)
        })

        it("reports the real Postgres and Redis endpoints as reachable",
            async () => {
                const response = await health()
                expect(response.body.errors).toBeUndefined()
                const components = response.body.data.systemHealthStatus.data.components

                expect(components).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        name: "postgres",
                        status: "up",
                        message: null,
                    }),
                    expect.objectContaining({
                        name: "redis",
                        status: "up",
                        message: null,
                    }),
                ]))
            })

        it("returns a successful payload with an isolated down dependency",
            async () => {
                const response = await health()
                expect(response.body.data.systemHealthStatus.success).toBe(true)
                expect(response.body.data.systemHealthStatus.data.components)
                    .toContainEqual(expect.objectContaining({
                        name: "judge0",
                        status: "down",
                        latencyMs: null,
                        message: "representative dependency unavailable",
                    }))
            })

        it("reuses the bounded production health snapshot for immediate polls",
            async () => {
                const first = await health()
                const second = await health()
                const firstPostgres = first.body.data.systemHealthStatus.data.components
                    .find((component) => component.name === "postgres")
                const secondPostgres = second.body.data.systemHealthStatus.data.components
                    .find((component) => component.name === "postgres")

                expect(firstPostgres?.checkedAt).toBe(secondPostgres?.checkedAt)
            })
    })
