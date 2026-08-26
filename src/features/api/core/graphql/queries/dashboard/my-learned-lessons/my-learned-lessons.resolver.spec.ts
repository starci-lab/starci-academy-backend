import {
    ContentEntity
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    toGlobalId
} from "@modules/platform/routing/utils/global-id"
import {
    MyLearnedLessonsResolver
} from "./my-learned-lessons.resolver"

describe("MyLearnedLessonsResolver",
    () => {
        it("queries recent read content and drops deleted lessons",
            async () => {
                const find = jest.fn().mockResolvedValue([
                    {
                        content: {
                            id: "content-1",
                            title: "HTTP caching",
                        },
                    },
                    {
                        content: null,
                    },
                ])
                const resolver = new MyLearnedLessonsResolver({
                    find
                } as never)

                await expect(resolver.execute({
                    id: "user-1"
                } as never)).resolves.toEqual([
                    {
                        globalId: toGlobalId(ContentEntity.name,
                            "content-1"),
                        label: "HTTP caching",
                    },
                ])
                expect(find).toHaveBeenCalledWith(expect.anything(),
                    {
                        where: {
                            userId: "user-1",
                            isRead: true,
                        },
                        relations: {
                            content: true,
                        },
                        order: {
                            updatedAt: "DESC",
                        },
                        take: 30,
                    })
            })

        it("returns no lessons for an empty history and propagates database errors",
            async () => {
                const find = jest.fn().mockResolvedValue([])
                const resolver = new MyLearnedLessonsResolver({
                    find
                } as never)
                await expect(resolver.execute({
                    id: "user-empty"
                } as never)).resolves.toEqual([])

                const failure = new Error("database unavailable")
                find.mockRejectedValueOnce(failure)
                await expect(resolver.execute({
                    id: "user-1"
                } as never)).rejects.toBe(failure)
            })
    })
