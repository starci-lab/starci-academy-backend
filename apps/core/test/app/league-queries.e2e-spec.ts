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
    PrimaryPostgreSQLModule,
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    LeagueCohortPointsProjectionService,
    LeagueService,
} from "@modules/bussiness"
import {
    MyLeagueResolver,
} from "@features/api/core/graphql/queries/league/my-league/my-league.resolver"
import {
    GlobalLeaderboardResolver,
} from "@features/api/core/graphql/queries/league/global-leaderboard/global-leaderboard.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the weekly-league reads -- `myLeague` (the viewer's tier + ranked
 * cohort board, lazily placing a never-seen user into Bronze) and
 * `globalLeaderboard` (the all-users board ranked by spendable Coin). Drives
 * the real {@link LeagueService} (+ its cohort-points CQRS projection) against
 * Testcontainers Postgres.
 *
 * MOCKED: nothing beyond the Keycloak guard. Postgres, Apollo, the league
 * service, and its projection are all real.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Weekly league reads (e2e)",
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

        const MY_LEAGUE_QUERY = `
            query MyLeague {
                myLeague {
                    success
                    error
                    data {
                        tier
                        promoteCount
                        demoteCount
                        entries {
                            userGlobalId
                            username
                            weekPoints
                            rank
                        }
                    }
                }
            }
        `
        const GLOBAL_LEADERBOARD_QUERY = `
            query GlobalLeaderboard {
                globalLeaderboard {
                    success
                    error
                    data {
                        myRank
                        myPoints
                        entries {
                            userGlobalId
                            username
                            points
                            rank
                        }
                    }
                }
            }
        `

        const post = (query: string) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
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
                ],
                providers: [
                    MyLeagueResolver,
                    GlobalLeaderboardResolver,
                    LeagueService,
                    LeagueCohortPointsProjectionService,
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
            // user_leagues + xp_histories cascade from users; league_cohort_points_projections
            // cascades from league_cohorts. Truncating both roots clears every row this suite writes.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"league_cohorts\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
        })

        const seedUser = async (
            keycloakId: string,
            overrides: Partial<Pick<UserEntity, "username" | "coinBalance">> = {
            },
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        ...overrides,
                    }),
            )

        describe("myLeague",
            () => {
                it("never-seen user is lazily placed into Bronze + ranked in their own cohort",
                    async () => {
                        currentUser = await seedUser("kc-myleague-happy",
                            {
                                username: "league-happy",
                            })
                        // one XP-earning event this week -> the projection's SUM picks it up
                        await entityManager.save(
                            entityManager.create(XpHistoryEntity,
                                {
                                    user: currentUser,
                                    source: XpSource.Challenge,
                                    amount: 20,
                                    points: 20,
                                    refId: "myleague-happy-xp-1",
                                }),
                        )

                        const response = await post(MY_LEAGUE_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.myLeague
                        expect(body.success).toBe(true)
                        expect(body.data.tier).toBe("bronze")
                        const entries = body.data.entries as Array<{
                            username: string | null
                            weekPoints: number
                            rank: number
                        }>
                        expect(entries).toHaveLength(1)
                        expect(entries[0].username).toBe("league-happy")
                        expect(entries[0].weekPoints).toBe(20)
                        expect(entries[0].rank).toBe(1)
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        const response = await post(MY_LEAGUE_QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("globalLeaderboard",
            () => {
                it("ranks all users by Coin balance, best first, and reports the viewer's own standing",
                    async () => {
                        const leader = await seedUser("kc-leaderboard-leader",
                            {
                                username: "leaderboard-leader",
                                coinBalance: 500,
                            })
                        currentUser = await seedUser("kc-leaderboard-viewer",
                            {
                                username: "leaderboard-viewer",
                                coinBalance: 100,
                            })
                        await seedUser("kc-leaderboard-trailing",
                            {
                                username: "leaderboard-trailing",
                                coinBalance: 10,
                            })

                        const response = await post(GLOBAL_LEADERBOARD_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.globalLeaderboard
                        expect(body.success).toBe(true)
                        const entries = body.data.entries as Array<{
                            username: string | null
                            points: number
                            rank: number
                        }>
                        expect(entries).toHaveLength(3)
                        expect(entries[0].username).toBe(leader.username)
                        expect(entries[0].rank).toBe(1)
                        expect(entries[0].points).toBe(500)
                        // the viewer sits in the middle -- their own standing is reported
                        // directly, not merely re-derived from the top-N list
                        expect(body.data.myRank).toBe(2)
                        expect(body.data.myPoints).toBe(100)
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        const response = await post(GLOBAL_LEADERBOARD_QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })
    })
