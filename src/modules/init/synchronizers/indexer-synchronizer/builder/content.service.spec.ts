import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    IndexerContentBuildService,
} from "./content.service"

describe("IndexerContentBuildService",
    () => {
        it("caches the parent course/module index for an existing content",
            async () => {
                const findOne = jest.fn()
                    .mockResolvedValueOnce({
                        id: "content-1",
                        displayId: "content",
                        moduleId: "module-1",
                    })
                    .mockResolvedValueOnce({
                        id: "module-1",
                        displayId: "module",
                        courseId: "course-1",
                    })
                    .mockResolvedValueOnce({
                        id: "course-1",
                        displayId: "course",
                    })
                const set = jest.fn().mockResolvedValue(undefined)
                const service = new IndexerContentBuildService(
                    {
                        findOne,
                    } as never,
                    {
                        set,
                    } as never,
                )

                await service.buildIndexerById("content-1")

                expect(findOne).toHaveBeenNthCalledWith(1,
                    ContentEntity,
                    expect.objectContaining({
                        where: {
                            id: "content-1"
                        }
                    }))
                expect(set).toHaveBeenCalledWith({
                    key: CacheKey.ParentIndex,
                    args: [ContentEntity.name,
                        "content-1"],
                    cacheResult: {
                        content: {
                            id: "content-1", displayId: "content"
                        },
                        module: {
                            id: "module-1", displayId: "module"
                        },
                        course: {
                            id: "course-1", displayId: "course"
                        },
                    },
                })
            })

        it("fails fast when content is absent",
            async () => {
                const service = new IndexerContentBuildService(
                    {
                        findOne: jest.fn().mockResolvedValue(null),
                    } as never,
                    {
                        set: jest.fn(),
                    } as never,
                )

                await expect(service.buildIndexerById("missing"))
                    .rejects.toBeInstanceOf(ContentNotFoundException)
            })

        it("queries the expected parent entity classes",
            async () => {
                const findOne = jest.fn()
                    .mockResolvedValueOnce({
                        id: "content", moduleId: "module", displayId: "c"
                    })
                    .mockResolvedValueOnce({
                        id: "module", courseId: "course", displayId: "m"
                    })
                    .mockResolvedValueOnce({
                        id: "course", displayId: "course"
                    })
                const service = new IndexerContentBuildService(
                    {
                        findOne
                    } as never,
                    {
                        set: jest.fn().mockResolvedValue(undefined)
                    } as never,
                )
                await service.buildIndexerById("content")
                expect(findOne.mock.calls.map((call) => call[0])).toEqual([
                    ContentEntity,
                    ModuleEntity,
                    CourseEntity,
                ])
            })
    })
