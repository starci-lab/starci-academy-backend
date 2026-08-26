import type {
    EntityManager,
} from "typeorm"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    MyXpHistoryResolver,
} from "./my-xp-history.resolver"

describe("MyXpHistoryResolver",
    () => {
        it("maps history rows and clamps default pagination for the authenticated user",
            async () => {
                const createdAt = new Date("2026-01-01T00:00:00.000Z")
                const findAndCount = jest.fn().mockResolvedValueOnce([[{
                    id: "xp-1", source: "challenge", amount: 25, points: 25,
                    courseId: null, createdAt,
                }],
                1])
                const resolver = new MyXpHistoryResolver({
                    findAndCount,
                } as unknown as EntityManager)

                await expect(resolver.execute(
                    {
                        id: "user-1",
                    } as unknown as UserEntity,
                    undefined as never,
                    undefined as never,
                    undefined,
                )).resolves.toEqual({
                    items: [{
                        id: "xp-1", source: "challenge", amount: 25, points: 25,
                        courseId: null, createdAt,
                    }],
                    total: 1,
                })
                expect(findAndCount).toHaveBeenCalledWith(XpHistoryEntity,
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                        },
                        take: 50,
                        skip: 0,
                    }))
            })

        it("applies the upper limit and optional course scope while preserving empty pages",
            async () => {
                const findAndCount = jest.fn().mockResolvedValue([[],
                    0])
                const resolver = new MyXpHistoryResolver({
                    findAndCount,
                } as unknown as EntityManager)

                await expect(resolver.execute(
                    {
                        id: "user-1",
                    } as unknown as UserEntity,
                    999,
                    -4,
                    "course-1",
                )).resolves.toEqual({
                    items: [], total: 0,
                })
                expect(findAndCount).toHaveBeenCalledWith(XpHistoryEntity,
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                            course: {
                                id: "course-1",
                            },
                        },
                        take: 200,
                        skip: 0,
                    }))
            })
    })
