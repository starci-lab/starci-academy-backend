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
    KpiKey,
    PrimaryPostgreSQLModule,
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    KpiRewardService,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    MyKpisResolver,
} from "@features/api/core/graphql/queries/dashboard/my-kpis/my-kpis.resolver"
import {
    ClaimKpiRewardResolver,
} from "@features/api/core/graphql/mutations/profile/claim-kpi-reward/claim-kpi-reward.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the weekly-KPI reads/writes -- `myKpis` (current-week value vs
 * self-set target, per KPI) and `claimKpiReward` (claims the Coin reward for
 * one met KPI, floor-tracked). Drives the real {@link UserStatsProjectionService}
 * (the `xp_histories` aggregate) and {@link KpiRewardService} against
 * Testcontainers Postgres.
 *
 * MOCKED: nothing beyond the Keycloak guard. Postgres, Apollo, and both
 * services are real.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Weekly KPI reward reads/writes (e2e)",
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

        const GRAPHQL_ENDPOINT = "/graphql"

        const MY_KPIS_QUERY = `
            query MyKpis {
                myKpis {
                    success
                    error
                    data {
                        items {
                            key
                            current
                            target
                            coinReward
                            claimed
                            canClaim
                        }
                        composite {
                            percent
                            completed
                            total
                        }
                    }
                }
            }
        `
        const CLAIM_KPI_REWARD_MUTATION = `
            mutation ClaimKpiReward($request: ClaimKpiRewardRequest!) {
                claimKpiReward(request: $request) {
                    success
                    error
                    data {
                        coinReward
                        balance
                    }
                }
            }
        `

        const post = (query: string, variables: Record<string, unknown> = {
        }) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables,
                })

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
                ],
                providers: [
                    MyKpisResolver,
                    ClaimKpiRewardResolver,
                    UserStatsProjectionService,
                    KpiRewardService,
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
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // xp_histories, kpi_weekly_reward_floors, coin_histories, and
            // user_stats_projections all cascade from users.
            await entityManager.query(
                "TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
        })

        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        weeklyKpiTargets: {
                            [KpiKey.StudyDays]: 1,
                        },
                    }),
            )

        describe("myKpis",
            () => {
                it("reports the REAL current-week value against the self-set target",
                    async () => {
                        currentUser = await seedUser("kc-mykpis-happy")
                        // one XP event today -> weeklyStudyDays = 1, meets the target of 1
                        await entityManager.save(
                            entityManager.create(XpHistoryEntity,
                                {
                                    user: currentUser,
                                    source: XpSource.LessonRead,
                                    amount: 3,
                                    points: 5,
                                    refId: "mykpis-happy-xp-1",
                                }),
                        )

                        const response = await post(MY_KPIS_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.myKpis
                        expect(body.success).toBe(true)
                        const items = body.data.items as Array<{
                            key: string
                            current: number
                            target: number | null
                            coinReward: number | null
                            claimed: boolean
                            canClaim: boolean
                        }>
                        const studyDays = items.find((item) => item.key === KpiKey.StudyDays)
                        expect(studyDays).toBeDefined()
                        expect(studyDays?.current).toBe(1)
                        expect(studyDays?.target).toBe(1)
                        // floorTarget(1) * KPI_REWARD_PER_UNIT_TARGET.studyDays(4) = 4
                        expect(studyDays?.coinReward).toBe(4)
                        expect(studyDays?.claimed).toBe(false)
                        expect(studyDays?.canClaim).toBe(true)
                        expect(body.data.composite.completed).toBe(1)
                        expect(body.data.composite.total).toBe(1)
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        const response = await post(MY_KPIS_QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("claimKpiReward",
            () => {
                it("grants the floor-tracked Coin reward and credits the REAL balance",
                    async () => {
                        currentUser = await seedUser("kc-claimkpi-happy")
                        await entityManager.save(
                            entityManager.create(XpHistoryEntity,
                                {
                                    user: currentUser,
                                    source: XpSource.LessonRead,
                                    amount: 3,
                                    points: 5,
                                    refId: "claimkpi-happy-xp-1",
                                }),
                        )

                        const response = await post(CLAIM_KPI_REWARD_MUTATION,
                            {
                                request: {
                                    key: KpiKey.StudyDays,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.claimKpiReward
                        expect(body.success).toBe(true)
                        expect(body.data.coinReward).toBe(4)
                        expect(body.data.balance).toBe(4)

                        const reloaded = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloaded.coinBalance).toBe(4)
                    })

                it("claiming the SAME KPI twice this week is rejected — no double credit",
                    async () => {
                        currentUser = await seedUser("kc-claimkpi-twice")
                        await entityManager.save(
                            entityManager.create(XpHistoryEntity,
                                {
                                    user: currentUser,
                                    source: XpSource.LessonRead,
                                    amount: 3,
                                    points: 5,
                                    refId: "claimkpi-twice-xp-1",
                                }),
                        )

                        const first = await post(CLAIM_KPI_REWARD_MUTATION,
                            {
                                request: {
                                    key: KpiKey.StudyDays,
                                },
                            })
                        expect(first.body.data.claimKpiReward.success).toBe(true)

                        const second = await post(CLAIM_KPI_REWARD_MUTATION,
                            {
                                request: {
                                    key: KpiKey.StudyDays,
                                },
                            })

                        expect(second.status).toBe(200)
                        const secondBody = second.body.data.claimKpiReward
                        expect(secondBody.success).toBe(false)
                        expect(secondBody.error).toBe("KPI_REWARD_ALREADY_CLAIMED_EXCEPTION")
                        expect(secondBody.data).toBeNull()

                        // the balance was credited exactly once, not twice
                        const reloaded = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloaded.coinBalance).toBe(4)
                    })
            })
    })
