import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    NotificationService,
} from "./notification.service"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    NotificationEntity,
    NotificationType,
} from "@modules/databases"
import {
    NotificationNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("NotificationService",
    () => {
        let module: TestingModule
        let service: NotificationService
        let entityManager: EntityManagerMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let userStatsProjectionService: jest.Mocked<
            Pick<UserStatsProjectionService, "recompute" | "getStats">
        >

        const userId = "user-1"
        const notificationId = "notification-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            userStatsProjectionService = {
                recompute: jest.fn().mockResolvedValue(undefined),
                getStats: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<UserStatsProjectionService, "recompute" | "getStats">
            >

            module = await Test.createTestingModule({
                providers: [
                    NotificationService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: UserStatsProjectionService,
                        useValue: userStatsProjectionService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<NotificationService>(NotificationService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("createNotification",
            () => {
                it("persists an unread row via the service's own manager and fans out the event",
                    async () => {
                        const saved = {
                            id: notificationId,
                            type: NotificationType.NewFollower,
                            payload: {
                                title: {
                                    key: "notif.newFollower.title",
                                },
                            },
                            readAt: null,
                            createdAt: new Date("2026-01-01T00:00:00Z"),
                        }
                        entityManager.save.mockResolvedValueOnce(saved)

                        const result = await service.createNotification({
                            userId,
                            type: NotificationType.NewFollower,
                            title: {
                                key: "notif.newFollower.title",
                            },
                        })

                        expect(result).toBe(saved)
                        // built via relation id only, always starts unread
                        expect(entityManager.create).toHaveBeenCalledWith(
                            NotificationEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                type: NotificationType.NewFollower,
                                readAt: null,
                            }),
                        )
                        // bumps the recipient's projection in the same unit of work
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId,
                            entityManager,
                        })
                        // fans out a self-contained snapshot so the gateway need not re-query
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.NotificationCreated,
                            payload: {
                                userId,
                                notification: {
                                    id: saved.id,
                                    type: saved.type,
                                    metadata: saved.payload,
                                    readAt: saved.readAt,
                                    createdAt: saved.createdAt,
                                },
                            },
                        })
                    })

                it("writes through the caller's transaction manager when one is provided",
                    async () => {
                        // a second, distinct manager standing in for the caller's transaction
                        const txManager = makeEntityManagerMock()
                        const saved = {
                            id: "notification-2",
                            type: NotificationType.CommentReply,
                            payload: {
                                title: {
                                    key: "notif.commentReply.title",
                                },
                            },
                            readAt: null,
                            createdAt: new Date("2026-01-02T00:00:00Z"),
                        }
                        txManager.save.mockResolvedValueOnce(saved)

                        await service.createNotification({
                            entityManager: txManager,
                            userId,
                            type: NotificationType.CommentReply,
                            title: {
                                key: "notif.commentReply.title",
                            },
                        })

                        // the caller's manager did the writing…
                        expect(txManager.create).toHaveBeenCalled()
                        expect(txManager.save).toHaveBeenCalled()
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId,
                            entityManager: txManager,
                        })
                        // …and the service's own manager was never touched
                        expect(entityManager.create).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("listNotifications",
            () => {
                it("scopes the listing to the recipient, newest first, with no extra filters by default",
                    async () => {
                        const items = [
                            {
                                id: notificationId,
                            } as NotificationEntity,
                        ]
                        entityManager.findAndCount.mockResolvedValueOnce([
                            items,
                            1,
                        ])

                        const result = await service.listNotifications({
                            userId,
                            limit: 20,
                            offset: 0,
                            unreadOnly: false,
                        })

                        expect(result).toEqual({
                            items,
                            total: 1,
                        })
                        expect(entityManager.findAndCount).toHaveBeenCalledWith(
                            NotificationEntity,
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                },
                                order: {
                                    createdAt: "DESC",
                                },
                                take: 20,
                                skip: 0,
                            },
                        )
                    })

                it("adds the readAt IS NULL filter when unreadOnly is requested",
                    async () => {
                        await service.listNotifications({
                            userId,
                            limit: 10,
                            offset: 0,
                            unreadOnly: true,
                        })

                        const [
                            ,
                            options,
                        ] = entityManager.findAndCount.mock.calls[0]
                        expect(options.where).toEqual(
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                readAt: expect.anything(),
                            }),
                        )
                    })

                it("adds the type filter only when a type is provided",
                    async () => {
                        await service.listNotifications({
                            userId,
                            limit: 10,
                            offset: 0,
                            unreadOnly: false,
                            type: NotificationType.NewFollower,
                        })

                        const [
                            ,
                            options,
                        ] = entityManager.findAndCount.mock.calls[0]
                        expect(options.where).toEqual({
                            user: {
                                id: userId,
                            },
                            type: NotificationType.NewFollower,
                        })
                    })
            })

        describe("countUnread",
            () => {
                it("reads the unread count off the flat user-stats projection",
                    async () => {
                        userStatsProjectionService.getStats.mockResolvedValueOnce({
                            unreadNotificationCount: 3,
                        } as Awaited<ReturnType<UserStatsProjectionService["getStats"]>>)

                        const result = await service.countUnread(userId)

                        expect(result).toBe(3)
                        expect(userStatsProjectionService.getStats).toHaveBeenCalledWith(userId)
                    })
            })

        describe("markAsRead",
            () => {
                it("throws NotificationNotFoundException when the row is missing or not owned by the user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.markAsRead({
                                userId,
                                notificationId,
                            }),
                        ).rejects.toBeInstanceOf(NotificationNotFoundException)
                        // ownership is folded into the lookup — never trust the client
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            NotificationEntity,
                            expect.objectContaining({
                                where: {
                                    id: notificationId,
                                    user: {
                                        id: userId,
                                    },
                                },
                            }),
                        )
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("is an idempotent no-op when the notification is already read",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: notificationId,
                            readAt: new Date("2026-01-01T00:00:00Z"),
                        })

                        await service.markAsRead({
                            userId,
                            notificationId,
                        })

                        // a double tap must never churn the row nor the projection
                        expect(entityManager.update).not.toHaveBeenCalled()
                        expect(userStatsProjectionService.recompute).not.toHaveBeenCalled()
                    })

                it("stamps an unread row as read and refreshes the projection",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: notificationId,
                            readAt: null,
                        })

                        await service.markAsRead({
                            userId,
                            notificationId,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            NotificationEntity,
                            {
                                id: notificationId,
                            },
                            {
                                readAt: expect.any(Date),
                            },
                        )
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId,
                        })
                    })
            })

        describe("markAllAsRead",
            () => {
                it("bulk-flips every unread row for the user in one statement and refreshes the projection",
                    async () => {
                        entityManager.update.mockResolvedValueOnce({
                            affected: 4,
                        })

                        const result = await service.markAllAsRead({
                            userId,
                        })

                        expect(result).toEqual({
                            markedCount: 4,
                        })
                        expect(entityManager.update).toHaveBeenCalledWith(
                            NotificationEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                            }),
                            {
                                readAt: expect.any(Date),
                            },
                        )
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId,
                        })
                    })

                it("coerces an undefined affected count to zero",
                    async () => {
                        entityManager.update.mockResolvedValueOnce({
                            affected: undefined,
                        })

                        const result = await service.markAllAsRead({
                            userId,
                        })

                        expect(result).toEqual({
                            markedCount: 0,
                        })
                    })
            })
    })
