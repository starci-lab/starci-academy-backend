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
    NotificationEntity,
    NotificationType,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    NotificationNotFoundException,
} from "@modules/exceptions"
import {
    NotificationService,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    EventEmitterService,
} from "@modules/event"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the notification-bell read-state mutations --
 * `markNotificationAsRead` / `markAllNotificationsAsRead` -- `.claude/canon/be/
 * enforce/authoring/testing.md` §2 names every write flow that commits state
 * as required e2e coverage; {@link NotificationService.markAsRead} /
 * `markAllAsRead` had zero coverage above the mocked-`EntityManager` unit
 * level. Runs the real ownership-scoped lookup, the real bulk `UPDATE`, and
 * the real `user_stats_projections` recompute against REAL Postgres
 * (Testcontainers) -- not a mock of any of them.
 *
 * MOCKED (genuinely external to the process, matches the pattern
 * `createE2eApp` uses for the same class):
 *  - `EventEmitterService` -- real class fans out through a NATS producer that
 *    needs a live broker connection; stubbed to a no-op so `createNotification`
 *    can seed fixture rows without booting NATS.
 *
 * REAL: Postgres (Testcontainers), `NotificationService` (the read-state
 * logic under test), and `UserStatsProjectionService` (the unread-badge
 * projection `markAsRead`/`markAllAsRead` recompute -- pure SQL, no external
 * deps) so the read-state mutation runs exactly as production wires it.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Notification-bell read-state mutations (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let notificationService: NotificationService

        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the read-state logic under test (create/markAsRead/
                    // markAllAsRead)
                    NotificationService,
                    // REAL -- the unread-badge projection recompute; pure SQL, no
                    // external deps, needs no stubbing
                    UserStatsProjectionService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                ],
            }).compile()

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

        it("markAsRead stamps readAt on the REAL row and refreshes the unread-count projection",
            async () => {
                const user = await seedUser("kc-noti-read")
                const notification = await notificationService.createNotification({
                    userId: user.id,
                    type: NotificationType.System,
                    title: {
                        key: "noti.system.title",
                    },
                })
                expect(notification.readAt).toBeNull()

                await notificationService.markAsRead({
                    userId: user.id,
                    notificationId: notification.id,
                })

                const reloaded = await entityManager.findOneOrFail(NotificationEntity,
                    {
                        where: {
                            id: notification.id,
                        },
                    })
                expect(reloaded.readAt).not.toBeNull()

                expect(await notificationService.countUnread(user.id)).toBe(0)
            })

        it("markAsRead is idempotent: a second call on an already-read row is a no-op (readAt never re-stamped)",
            async () => {
                const user = await seedUser("kc-noti-idempotent")
                const notification = await notificationService.createNotification({
                    userId: user.id,
                    type: NotificationType.System,
                    title: {
                        key: "noti.system.title",
                    },
                })

                await notificationService.markAsRead({
                    userId: user.id,
                    notificationId: notification.id,
                })
                const firstReadAt = (await entityManager.findOneOrFail(NotificationEntity,
                    {
                        where: {
                            id: notification.id,
                        },
                    })).readAt

                // a second "mark as read" tap must not churn the row -- the service
                // returns early on an already-read row rather than re-stamping
                await notificationService.markAsRead({
                    userId: user.id,
                    notificationId: notification.id,
                })
                const secondReadAt = (await entityManager.findOneOrFail(NotificationEntity,
                    {
                        where: {
                            id: notification.id,
                        },
                    })).readAt

                expect(secondReadAt).toEqual(firstReadAt)
            })

        it("markAsRead on another user's notification throws NotificationNotFoundException — ownership is folded into the lookup",
            async () => {
                const owner = await seedUser("kc-noti-owner")
                const stranger = await seedUser("kc-noti-stranger")
                const notification = await notificationService.createNotification({
                    userId: owner.id,
                    type: NotificationType.System,
                    title: {
                        key: "noti.system.title",
                    },
                })

                await expect(
                    notificationService.markAsRead({
                        userId: stranger.id,
                        notificationId: notification.id,
                    }),
                ).rejects.toBeInstanceOf(NotificationNotFoundException)

                // the unowned attempt must not have mutated the owner's row
                const reloaded = await entityManager.findOneOrFail(NotificationEntity,
                    {
                        where: {
                            id: notification.id,
                        },
                    })
                expect(reloaded.readAt).toBeNull()
            })

        it("markAsRead on a non-existent id throws NotificationNotFoundException",
            async () => {
                const user = await seedUser("kc-noti-missing")

                await expect(
                    notificationService.markAsRead({
                        userId: user.id,
                        notificationId: "11111111-1111-4111-8111-111111111111",
                    }),
                ).rejects.toBeInstanceOf(NotificationNotFoundException)
            })

        it("markAllAsRead flips every unread row for the user in ONE statement and returns the flipped count",
            async () => {
                const user = await seedUser("kc-noti-all")
                await notificationService.createNotification({
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

                const result = await notificationService.markAllAsRead({
                    userId: user.id,
                })
                expect(result.markedCount).toBe(2)

                const totalRows = await entityManager.count(NotificationEntity,
                    {
                        where: {
                            // `userId` is a @RelationId virtual column -- not queryable
                            // in `where`; filter through the real `user` relation.
                            user: {
                                id: user.id,
                            },
                        },
                    })
                expect(totalRows).toBe(2)
                expect(await notificationService.countUnread(user.id)).toBe(0)
            })

        it("markAllAsRead never touches another user's unread rows",
            async () => {
                const user = await seedUser("kc-noti-scoped-a")
                const other = await seedUser("kc-noti-scoped-b")
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

                await notificationService.markAllAsRead({
                    userId: user.id,
                })

                expect(await notificationService.countUnread(user.id)).toBe(0)
                expect(await notificationService.countUnread(other.id)).toBe(1)
            })

        it("markAllAsRead is idempotent: a second call with nothing left unread marks ZERO rows",
            async () => {
                const user = await seedUser("kc-noti-all-idempotent")
                await notificationService.createNotification({
                    userId: user.id,
                    type: NotificationType.System,
                    title: {
                        key: "noti.system.title",
                    },
                })

                const first = await notificationService.markAllAsRead({
                    userId: user.id,
                })
                expect(first.markedCount).toBe(1)

                const second = await notificationService.markAllAsRead({
                    userId: user.id,
                })
                expect(second.markedCount).toBe(0)
            })
    })
