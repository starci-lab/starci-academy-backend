import {
    UserFollowingResolver
} from "./user-following.resolver"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    UserFollowEntity
} from "@modules/databases/postgresql/primary/entities/user-follow.entity"

describe("UserFollowingResolver",
    () => {
        let entityManager: { findOne: jest.Mock; find: jest.Mock }
        let resolver: UserFollowingResolver
        beforeEach(() => {
            entityManager = {
                findOne: jest.fn().mockResolvedValue(null), find: jest.fn().mockResolvedValue([])
            }
            resolver = new UserFollowingResolver(entityManager as never)
        })
        it("returns empty when target is absent",
            async () => {
                await expect(resolver.execute("deleted",
                    20,
                    0)).resolves.toEqual([])
                expect(entityManager.find).not.toHaveBeenCalled()
            })
        it("loads following users and omits deleted rows",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: "target"
                })
                entityManager.find.mockResolvedValue([
                    {
                        following: {
                            id: "followed", username: "followed", displayName: "Followed", avatar: null, isDeleted: false
                        }
                    },
                    {
                        following: {
                            id: "gone", isDeleted: true
                        }
                    },
                ])
                await expect(resolver.execute("target",
null as never,
null as never)).resolves.toEqual([
                    expect.objectContaining({
                        username: "followed", displayName: "Followed", avatar: null
                    }),
                ])
                expect(entityManager.find).toHaveBeenCalledWith(UserFollowEntity,
                    expect.objectContaining({
                        where: {
                            follower: {
                                id: "target"
                            }
                        }, skip: 0, take: 20, relations: {
                            following: true
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
