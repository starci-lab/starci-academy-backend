import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ActivityEntity,
    ActivityType,
    NotificationType,
    PrimaryPostgreSQLModule,
    UserEntity,
    UserFollowEntity,
} from "@modules/databases"
import {
    NotificationService,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    KeycloakJwksService,
} from "@modules/keycloak"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import {
    SetFollowResolver,
} from "@features/api/core/graphql/mutations/follows/set-follow/set-follow.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the follow/unfollow toggle -- `.claude/canon/be/enforce/authoring/testing.md`
 * §2 coverage rule: every mutation that commits a row a user later sees earns
 * an e2e. `setFollow` writes THREE things in one transaction (the follow edge,
 * a feed `ActivityEntity`, and -- outside the transaction -- the recomputed
 * `UserStatsProjectionEntity` for both endpoints), so this proves the wiring
 * against REAL Postgres (Testcontainers), not a mocked `EntityManager`.
 *
 * MOCKED: `NotificationService` -- its real implementation needs
 * `EventEmitterService`, which in turn needs a live NATS producer; out of
 * scope for a focused follow-graph spec (same pattern `create-e2e-app.ts` uses
 * to stub `NotificationService` for the payment webhook flows). Stubbed to a
 * spy so the notification fan-out call itself is still asserted.
 *
 * REAL: Postgres (Testcontainers), `SetFollowResolver`, and
 * `UserStatsProjectionService` (only needs the entity manager -- no external
 * seam to stub).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Follow / unfollow (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let setFollowResolver: SetFollowResolver
        let createNotification: jest.Mock

        beforeAll(async () => {
            createNotification = jest.fn()

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the resolver under test
                    SetFollowResolver,
                    // REAL -- recompute() only needs the entity manager
                    UserStatsProjectionService,
                    // mocked -- createNotification needs a live NATS-backed event emitter
                    {
                        provide: NotificationService,
                        useValue: {
                            createNotification,
                        },
                    },
                    // guard deps -- `SetFollowResolver` carries
                    // `@UseGuards(KeycloakAuthGraphQLGuard)`, so Nest constructs the
                    // guard as an enhancer at `app.init()` even though this test
                    // invokes `execute()` directly; its constructor deps must resolve
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            setFollowResolver = app.get(SetFollowResolver)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"user_follows\", \"activities\", \"user_stats_projections\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a minimal user row. */
        const seedUser = async (
            keycloakId: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        username: keycloakId,
                    }),
            )

        it("follow → creates the edge, a userFollowed activity, recomputed stats on both sides, and a notification",
            async () => {
                const follower = await seedUser("kc-follower")
                const target = await seedUser("kc-target")

                await setFollowResolver.execute(
                    {
                        userId: target.id,
                        follow: true,
                    },
                    follower,
                )

                const edge = await entityManager.findOneOrFail(UserFollowEntity,
                    {
                        where: {
                            follower: {
                                id: follower.id,
                            },
                            following: {
                                id: target.id,
                            },
                        },
                    })
                expect(edge).toBeDefined()

                const activity = await entityManager.findOneOrFail(ActivityEntity,
                    {
                        where: {
                            type: ActivityType.UserFollowed,
                            idempotencyKey: `${follower.id}:${target.id}`,
                        },
                    })
                expect(activity.userId).toBe(follower.id)

                // both endpoints' derived counters must reflect the new edge
                const followerRow = await entityManager.query(
                    "SELECT value FROM user_stats_projections WHERE user_id = $1",
                    [
                        follower.id,
                    ],
                )
                expect(Number(followerRow[0].value.followingCount)).toBe(1)
                const targetRow = await entityManager.query(
                    "SELECT value FROM user_stats_projections WHERE user_id = $1",
                    [
                        target.id,
                    ],
                )
                expect(Number(targetRow[0].value.followerCount)).toBe(1)

                expect(createNotification).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: target.id,
                        type: NotificationType.NewFollower,
                    }),
                )
            })

        it("is idempotent: following twice does not duplicate the edge, the activity row, or the notification",
            async () => {
                const follower = await seedUser("kc-follower-dup")
                const target = await seedUser("kc-target-dup")

                await setFollowResolver.execute(
                    {
                        userId: target.id,
                        follow: true,
                    },
                    follower,
                )
                await setFollowResolver.execute(
                    {
                        userId: target.id,
                        follow: true,
                    },
                    follower,
                )

                const edgeCount = await entityManager.count(UserFollowEntity,
                    {
                        where: {
                            follower: {
                                id: follower.id,
                            },
                            following: {
                                id: target.id,
                            },
                        },
                    })
                expect(edgeCount).toBe(1)

                const activityCount = await entityManager.count(ActivityEntity,
                    {
                        where: {
                            type: ActivityType.UserFollowed,
                            idempotencyKey: `${follower.id}:${target.id}`,
                        },
                    })
                expect(activityCount).toBe(1)

                // the second call short-circuited before `followed` flipped true --
                // no second notification fired
                expect(createNotification).toHaveBeenCalledTimes(1)
            })

        it("unfollow removes the edge but the activity row stays (append-only feed ledger)",
            async () => {
                const follower = await seedUser("kc-follower-un")
                const target = await seedUser("kc-target-un")

                await setFollowResolver.execute(
                    {
                        userId: target.id,
                        follow: true,
                    },
                    follower,
                )
                await setFollowResolver.execute(
                    {
                        userId: target.id,
                        follow: false,
                    },
                    follower,
                )

                const edge = await entityManager.findOne(UserFollowEntity,
                    {
                        where: {
                            follower: {
                                id: follower.id,
                            },
                            following: {
                                id: target.id,
                            },
                        },
                    })
                expect(edge).toBeNull()

                // the earlier follow's activity row is never deleted
                const activityCount = await entityManager.count(ActivityEntity,
                    {
                        where: {
                            type: ActivityType.UserFollowed,
                            idempotencyKey: `${follower.id}:${target.id}`,
                        },
                    })
                expect(activityCount).toBe(1)

                // derived counters recover back to 0
                const followerRow = await entityManager.query(
                    "SELECT value FROM user_stats_projections WHERE user_id = $1",
                    [
                        follower.id,
                    ],
                )
                expect(Number(followerRow[0].value.followingCount)).toBe(0)
            })

        it("self-follow is a silent no-op: no edge, no activity, no notification",
            async () => {
                const user = await seedUser("kc-self-follow")

                await setFollowResolver.execute(
                    {
                        userId: user.id,
                        follow: true,
                    },
                    user,
                )

                const edgeCount = await entityManager.count(UserFollowEntity)
                expect(edgeCount).toBe(0)
                const activityCount = await entityManager.count(ActivityEntity)
                expect(activityCount).toBe(0)
                expect(createNotification).not.toHaveBeenCalled()
            })
    })
