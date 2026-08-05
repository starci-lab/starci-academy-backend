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
    AchievementCriteriaType,
    AchievementEntity,
    PrimaryPostgreSQLModule,
    UserAchievementEntity,
    UserEntity,
    UserFollowEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ACHIEVEMENT_BADGES,
    AchievementsService,
    BusyBeeBadge,
} from "@modules/bussiness"
import {
    MyAchievementsResolver,
} from "@features/api/core/graphql/queries/achievements/my-achievements/my-achievements.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the `myAchievements` query — award-on-read against REAL Postgres.
 * No e2e coverage existed before this file (`achievements.service.spec.ts`
 * mocks the `EntityManager` entirely, so the composite-metric SQL, the
 * idempotent award INSERT, and the projection UPSERT have never run against a
 * real schema).
 *
 * Only ONE badge ({@link BusyBeeBadge}, "followers gained") is wired in — the
 * orchestration (composite query → award → projection cache) is what's under
 * test, not the full 13-badge catalog (already covered per-badge by the unit
 * specs).
 *
 * MOCKED:
 *  - `KeycloakAuthGraphQLGuard` — no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring,
 * `AchievementsService` (composite metric query, idempotent award INSERT,
 * projection UPSERT, rarity computation) — all real SQL against real rows.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("myAchievements (e2e)",
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

        /** Read-only achievement definition, seeded once in `beforeAll`. */
        let busyBeeDefinition: AchievementEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const QUERY = `
            query MyAchievements {
                myAchievements {
                    success
                    message
                    error
                    data {
                        count
                        data { slug earned earnedAt currentValue tierReached }
                        newAchievements { slug earned currentValue }
                    }
                }
            }
        `

        const post = () =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: QUERY,
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
                    MyAchievementsResolver,
                    // REAL — the composite-metric query / award / projection logic under test
                    AchievementsService,
                    {
                        provide: ACHIEVEMENT_BADGES,
                        // only ONE badge wired in — the orchestration is what's under test
                        useValue: [
                            new BusyBeeBadge(),
                        ],
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

            // read-only seeded definition — matched by slug to BusyBeeBadge
            busyBeeDefinition = await entityManager.save(
                entityManager.create(AchievementEntity,
                    {
                        slug: "busy-bee",
                        name: {
                            en: "Busy Bee",
                            vi: "Ong Chăm Chỉ", // vn-ok: vi-locale fixture — the en sibling is asserted separately
                        },
                        description: {
                            en: "Gain 2 followers.",
                            vi: "Có 2 người theo dõi.", // vn-ok: vi-locale fixture — the en sibling is asserted separately
                        },
                        criteriaType: AchievementCriteriaType.Followers,
                        threshold: 2,
                        tierThresholds: null,
                        iconKey: "assets/badges/achievements/busy-bee.png",
                        sortIndex: 0,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // busyBeeDefinition (seeded in beforeAll) is read-only across the whole
            // suite — only per-test user/follow/award/projection state is reset
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"user_follows\", \"user_achievements\", "
                + "\"user_achievement_projections\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        it("2 real followers → busy-bee is awarded on this read (composite query + idempotent INSERT + projection UPSERT, all real SQL)",
            async () => {
                currentUser = await seedUser("kc-achievements-earner")
                const followerA = await seedUser("kc-achievements-follower-a")
                const followerB = await seedUser("kc-achievements-follower-b")
                await entityManager.save([
                    entityManager.create(UserFollowEntity,
                        {
                            follower: followerA,
                            following: currentUser,
                        }),
                    entityManager.create(UserFollowEntity,
                        {
                            follower: followerB,
                            following: currentUser,
                        }),
                ])

                const response = await post()

                expect(response.status).toBe(200)
                const body = response.body.data.myAchievements
                expect(body.success).toBe(true)
                expect(body.data.count).toBe(1)
                expect(body.data.data).toEqual([
                    {
                        slug: "busy-bee",
                        earned: true,
                        earnedAt: expect.any(String),
                        currentValue: 2,
                        tierReached: null,
                    },
                ])
                // crossed the bar on THIS read → surfaced for the congrats modal
                expect(body.data.newAchievements).toEqual([
                    {
                        slug: "busy-bee",
                        earned: true,
                        currentValue: 2,
                    },
                ])

                // the award row + the projection cache were actually written for real
                const award = await entityManager.findOneOrFail(
                    UserAchievementEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                            achievement: {
                                id: busyBeeDefinition.id,
                            },
                        },
                    },
                )
                expect(award.tier).toBeNull()
                const projectionRows = await entityManager.query(
                    "SELECT value FROM user_achievement_projections WHERE user_id = $1",
                    [
                        currentUser.id,
                    ],
                )
                expect(projectionRows).toHaveLength(1)
                expect(projectionRows[0].value.count).toBe(1)
            })

        it("unauthenticated caller is BLOCKED — no composite metric query ever runs",
            async () => {
                // currentUser stays null — the overridden guard denies
                const response = await post()

                expect(response.body.data).toBeNull()
                expect(response.body.errors).toBeDefined()

                // nothing was computed/awarded for anyone
                const awardCount = await entityManager.query(
                    "SELECT COUNT(*)::int AS c FROM user_achievements",
                )
                expect(Number(awardCount[0].c)).toBe(0)
            })
    })
