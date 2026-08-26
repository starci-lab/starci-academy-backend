import {
    SetFollowResolver
} from "./set-follow.resolver"

describe("SetFollowResolver",
    () => {
        it("no-ops self follows without opening a transaction",
            async () => {
                const entityManager = {
                    transaction: jest.fn()
                }
                const resolver = new SetFollowResolver(entityManager as never,
{
    recompute: jest.fn()
} as never,
{
    createNotification: jest.fn()
} as never)
                await expect(resolver.execute({
                    userId: "u1", follow: true
                },
{
    id: "u1", username: "me"
} as never)).resolves.toEqual({
                })
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })
        it("creates a follow, activity, notification, and refreshes both stats",
            async () => {
                const target = {
                    id: "u2",
                    username: "target",
                }
                const transactionManager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce(null)
                        .mockResolvedValueOnce(target)
                        .mockResolvedValueOnce(null),
                    create: jest.fn().mockReturnValue({
                        follower: {
                            id: "u1",
                        },
                        following: {
                            id: "u2",
                        },
                    }),
                    save: jest.fn().mockResolvedValue(undefined),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback(transactionManager)),
                }
                const stats = {
                    recompute: jest.fn().mockResolvedValue(undefined),
                }
                const notification = {
                    createNotification: jest.fn().mockResolvedValue(undefined),
                }
                const resolver = new SetFollowResolver(entityManager as never,
                    stats as never,
                    notification as never)

                await resolver.execute({
                    userId: "u2",
                    follow: true,
                },
                {
                    id: "u1",
                    username: "follower",
                } as never)

                expect(transactionManager.create).toHaveBeenCalledTimes(1)
                expect(transactionManager.save).toHaveBeenCalledTimes(2)
                expect(stats.recompute).toHaveBeenNthCalledWith(1,
                    {
                        userId: "u1",
                    })
                expect(stats.recompute).toHaveBeenNthCalledWith(2,
                    {
                        userId: "u2",
                    })
                expect(notification.createNotification).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "u2",
                    target: expect.objectContaining({
                        id: "u1",
                    }),
                }))
            })
        it("keeps an existing follow idempotent without creating a duplicate notification",
            async () => {
                const transactionManager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "edge",
                    }),
                    create: jest.fn(),
                    save: jest.fn(),
                    remove: jest.fn(),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback(transactionManager)),
                }
                const stats = {
                    recompute: jest.fn().mockResolvedValue(undefined),
                }
                const notification = {
                    createNotification: jest.fn(),
                }
                const resolver = new SetFollowResolver(entityManager as never,
                    stats as never,
                    notification as never)

                await resolver.execute({
                    userId: "u2",
                    follow: true,
                },
                {
                    id: "u1",
                    username: "follower",
                } as never)

                expect(transactionManager.create).not.toHaveBeenCalled()
                expect(transactionManager.save).not.toHaveBeenCalled()
                expect(notification.createNotification).not.toHaveBeenCalled()
                expect(stats.recompute).toHaveBeenCalledTimes(2)
            })
        it("removes an existing edge on unfollow and tolerates an absent edge",
            async () => {
                const existing = {
                    id: "edge",
                }
                const transactionManager = {
                    findOne: jest.fn().mockResolvedValue(existing),
                    remove: jest.fn().mockResolvedValue(undefined),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<void>) => callback(transactionManager)),
                }
                const stats = {
                    recompute: jest.fn().mockResolvedValue(undefined),
                }
                const resolver = new SetFollowResolver(entityManager as never,
                    stats as never,
                    {
                        createNotification: jest.fn(),
                    } as never)
                await resolver.execute({
                    userId: "u2",
                    follow: false,
                },
                {
                    id: "u1",
                    username: "follower",
                } as never)
                expect(transactionManager.remove).toHaveBeenCalledWith(existing)

                transactionManager.findOne.mockResolvedValueOnce(null)
                await resolver.execute({
                    userId: "u2",
                    follow: false,
                },
                {
                    id: "u1",
                    username: "follower",
                } as never)
                expect(transactionManager.remove).toHaveBeenCalledTimes(1)
                expect(stats.recompute).toHaveBeenCalledTimes(4)
            })
    })
