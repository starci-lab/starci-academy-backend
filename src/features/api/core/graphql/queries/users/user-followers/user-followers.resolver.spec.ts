import {
    UserFollowersResolver
} from "./user-followers.resolver"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    UserFollowEntity
} from "@modules/databases/postgresql/primary/entities/user-follow.entity"

describe("UserFollowersResolver",
    () => {
        let entityManager: { findOne: jest.Mock; find: jest.Mock }
        let resolver: UserFollowersResolver
        beforeEach(() => {
            entityManager = {
                findOne: jest.fn().mockResolvedValue(null), find: jest.fn().mockResolvedValue([])
            }
            resolver = new UserFollowersResolver(entityManager as never)
        })
        it("returns empty for unknown user",
            async () => {
                await expect(resolver.execute("missing",
undefined as never,
undefined as never)).resolves.toEqual([])
                expect(entityManager.find).not.toHaveBeenCalled()
            })
        it("clamps pagination and filters deleted followers",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: "target"
                })
                entityManager.find.mockResolvedValue([
                    {
                        follower: {
                            id: "one", username: "one", displayName: "One", avatar: "a", isDeleted: false
                        }
                    },
                    {
                        follower: {
                            id: "deleted", isDeleted: true
                        }
                    },
                    {
                        follower: null
                    },
                ])
                await expect(resolver.execute("target",
                    999,
                    -4)).resolves.toEqual([
                    {
                        globalId: expect.any(String), username: "one", displayName: "One", avatar: "a"
                    },
                ])
                expect(entityManager.find).toHaveBeenCalledWith(UserFollowEntity,
                    expect.objectContaining({
                        skip: 0, take: 50, where: {
                            following: {
                                id: "target"
                            }
                        }
                    }))
                expect(entityManager.findOne).toHaveBeenCalledWith(UserEntity,
                    {
                        where: {
                            username: "target", isDeleted: false
                        }
                    })
            })
    })
