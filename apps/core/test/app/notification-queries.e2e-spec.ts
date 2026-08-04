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
    NotificationType,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    NotificationService,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    EventEmitterService,
} from "@modules/event"
import {
    MyNotificationsResolver,
} from "@features/api/core/graphql/queries/notifications/my-notifications/my-notifications.resolver"
import {
    MyUnreadNotificationCountResolver,
} from "@features/api/core/graphql/queries/notifications/my-unread-notification-count/my-unread-notification-count.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the notification-bell READ surface — `myNotifications` and
 * `myUnreadNotificationCount` — over REAL HTTP + REAL Postgres
 * (Testcontainers). `notifications.e2e-spec.ts` covers the write-side
 * (`markNotificationAsRead` / `markAllNotificationsAsRead`); this file is the
 * matching read-side coverage neither spec exercises yet.
 *
 * MOCKED (genuinely external, matches `notifications.e2e-spec.ts`):
 *  - `EventEmitterService` — real class fans out through a NATS producer that
 *    needs a live broker connection; stubbed to a no-op so
 *    `createNotification` can seed fixture rows without booting NATS.
 *
 * REAL: Postgres (Testcontainers), both resolvers under test,
 * `NotificationService` (`listNotifications` / `countUnread`),
 * `UserStatsProjectionService` (the unread-badge projection `countUnread`
 * reads, lazily recomputed), and `KeycloakAuthGraphQLGuard` — overridden only
 * to stamp `request.user` with whichever fake user the test "logs in" as.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Notification-bell read queries — myNotifications / myUnreadNotificationCount (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let notificationService: NotificationService

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

        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const MY_NOTIFICATIONS_QUERY = `
            query MyNotifications($limit: Int, $offset: Int, $unreadOnly: Boolean, $type: NotificationType) {
                myNotifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly, type: $type) {
                    success
                    error
                    data {
                        total
                        unreadCount
                        items {
                            id
                            type
                            isRead
                            title { key }
                        }
                    }
                }
            }
        `
        const UNREAD_COUNT_QUERY = `
            query UnreadCount {
                myUnreadNotificationCount {
                    success
                    error
                    data { count }
                }
            }
        `

        const get = (query: string, variables: Record<string, unknown> = {
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
                    // REAL — the two resolvers under test
                    MyNotificationsResolver,
                    MyUnreadNotificationCountResolver,
                    // REAL — listNotifications/countUnread run real SQL
                    NotificationService,
                    // REAL — the unread-badge projection countUnread reads (lazy
                    // recompute), pure SQL, no external deps
                    UserStatsProjectionService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
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
            notificationService = app.get(NotificationService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"notifications\", \"user_stats_projections\" RESTART IDENTITY CASCADE",
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

        describe("myNotifications",
            () => {
                it("returns the caller's page of notifications newest-first, with total + unreadCount folded in",
                    async () => {
                        const user = await seedUser("kc-my-notifications-happy")
                        currentUser = user
                        const first = await notificationService.createNotification({
                            userId: user.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })
                        await notificationService.markAsRead({
                            userId: user.id,
                            notificationId: first.id,
                        })
                        const second = await notificationService.createNotification({
                            userId: user.id,
                            type: NotificationType.NewFollower,
                            title: {
                                key: "noti.newFollower.title",
                            },
                        })

                        const response = await get(MY_NOTIFICATIONS_QUERY,
                            {
                                limit: 20,
                                offset: 0,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myNotifications
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(2)
                        expect(body.data.unreadCount).toBe(1)
                        const items = body.data.items as Array<{
                            id: string
                            isRead: boolean
                            title: { key: string }
                        }>
                        expect(items).toHaveLength(2)
                        // newest first
                        expect(items[0].id).toBe(second.id)
                        expect(items[0].isRead).toBe(false)
                        expect(items[0].title.key).toBe("noti.newFollower.title")
                        expect(items[1].id).toBe(first.id)
                        expect(items[1].isRead).toBe(true)
                    })

                it("never returns another user's notifications — the list is strictly scoped to the caller",
                    async () => {
                        const user = await seedUser("kc-my-notifications-scope-a")
                        const other = await seedUser("kc-my-notifications-scope-b")
                        await notificationService.createNotification({
                            userId: user.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })
                        await notificationService.createNotification({
                            userId: other.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })

                        currentUser = user
                        const response = await get(MY_NOTIFICATIONS_QUERY,
                            {
                                limit: 20,
                                offset: 0,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myNotifications
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(1)
                        expect(body.data.items).toHaveLength(1)
                    })
            })

        describe("myUnreadNotificationCount",
            () => {
                it("returns the caller's real unread count (the bell badge value)",
                    async () => {
                        const user = await seedUser("kc-unread-count-happy")
                        currentUser = user
                        const notification = await notificationService.createNotification({
                            userId: user.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })
                        await notificationService.createNotification({
                            userId: user.id,
                            type: NotificationType.NewFollower,
                            title: {
                                key: "noti.newFollower.title",
                            },
                        })

                        const beforeRead = await get(UNREAD_COUNT_QUERY)
                        expect(beforeRead.status).toBe(200)
                        expect(beforeRead.body.data.myUnreadNotificationCount.data.count).toBe(2)

                        await notificationService.markAsRead({
                            userId: user.id,
                            notificationId: notification.id,
                        })

                        const afterRead = await get(UNREAD_COUNT_QUERY)
                        expect(afterRead.body.data.myUnreadNotificationCount.data.count).toBe(1)
                    })

                it("never counts another user's unread notifications",
                    async () => {
                        const user = await seedUser("kc-unread-count-scope-a")
                        const other = await seedUser("kc-unread-count-scope-b")
                        await notificationService.createNotification({
                            userId: other.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })
                        await notificationService.createNotification({
                            userId: other.id,
                            type: NotificationType.System,
                            title: {
                                key: "noti.system.title",
                            },
                        })
                        // the caller has zero notifications of their own

                        currentUser = user
                        const response = await get(UNREAD_COUNT_QUERY)

                        expect(response.status).toBe(200)
                        expect(response.body.data.myUnreadNotificationCount.data.count).toBe(0)
                    })
            })
    })
