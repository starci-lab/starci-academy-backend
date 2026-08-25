import {
    UserStatsResolver
} from "./user-stats.resolver"
import {
    UserFollowEntity
} from "@modules/databases/postgresql/primary/entities/user-follow.entity"

describe("UserStatsResolver",
    () => {
        let entityManager: { count: jest.Mock }
        let statsService: { getStats: jest.Mock }
        let resolver: UserStatsResolver
        beforeEach(() => {
            entityManager = {
                count: jest.fn().mockResolvedValue(0)
            }
            statsService = {
                getStats: jest.fn().mockResolvedValue({
                    followerCount: 4, followingCount: 7
                })
            }
            resolver = new UserStatsResolver(entityManager as never,
statsService as never)
        })
        it("reads both counts from projection",
            async () => {
                const user = {
                    id: "user"
                } as never
                await expect(resolver.followerCount(user)).resolves.toBe(4)
                await expect(resolver.followingCount(user)).resolves.toBe(7)
                expect(statsService.getStats).toHaveBeenNthCalledWith(1,
                    "user")
                expect(statsService.getStats).toHaveBeenNthCalledWith(2,
                    "user")
            })
        it.each([[undefined],
            [{
                id: "user"
            }]])("returns false for anonymous/self viewers",
            async (viewer) => {
                await expect(resolver.isFollowedByMe({
                    id: "user"
                } as never,
{
    req: {
        user: viewer,
    }
} as never)).resolves.toBe(false)
                expect(entityManager.count).not.toHaveBeenCalled()
            })
        it("checks live edge for another viewer",
            async () => {
                entityManager.count.mockResolvedValue(1)
                await expect(resolver.isFollowedByMe({
                    id: "profile"
                } as never,
{
    req: {
        user: {
            id: "viewer"
        }
    }
} as never)).resolves.toBe(true)
                expect(entityManager.count).toHaveBeenCalledWith(UserFollowEntity,
                    {
                        where: {
                            follower: {
                                id: "viewer"
                            }, following: {
                                id: "profile"
                            }
                        }
                    })
            })
    })
