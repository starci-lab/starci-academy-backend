import {
    CourseEntity 
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    LabelResolverService 
} from "./label-resolver.service"

describe("LabelResolverService",
    () => {
        it("deduplicates refs, combines cache hits with database misses, and skips empty labels",
            async () => {
                const cache = {
                    get: jest.fn()
                        .mockResolvedValueOnce("Cached course")
                        .mockResolvedValueOnce("")
                        .mockResolvedValueOnce(undefined),
                    set: jest.fn().mockResolvedValue(undefined),
                }
                const entityManager = {
                    find: jest.fn().mockResolvedValue([{
                        id: "course-2", title: "Database course" 
                    },
                    {
                        id: "course-3", title: "" 
                    }]),
                }
                const service = new LabelResolverService(cache as never,
entityManager as never)

                const labels = await service.resolveLabels({
                    locale: Locale.En,
                    refs: [
                        {
                            entityName: CourseEntity.name, id: "course-1" 
                        },
                        {
                            entityName: CourseEntity.name, id: "course-1" 
                        },
                        {
                            entityName: CourseEntity.name, id: "course-2" 
                        },
                        {
                            entityName: CourseEntity.name, id: "course-3" 
                        },
                        {
                            entityName: "UnknownEntity", id: "ignored" 
                        },
                    ],
                })

                expect(labels.size).toBe(2)
                expect([...labels.values()]).toEqual(expect.arrayContaining(["Cached course",
                    "Database course"]))
                expect(entityManager.find).toHaveBeenCalledTimes(1)
                expect(cache.set).toHaveBeenCalledWith(expect.objectContaining({
                    cacheResult: "Database course" 
                }))
            })

        it("does not query the database when every known label is cached",
            async () => {
                const cache = {
                    get: jest.fn().mockResolvedValue("Cached"), set: jest.fn() 
                }
                const entityManager = {
                    find: jest.fn() 
                }
                const service = new LabelResolverService(cache as never,
entityManager as never)

                const labels = await service.resolveLabels({
                    locale: Locale.Vi, refs: [{
                        entityName: CourseEntity.name, id: "course-1" 
                    }] 
                })

                expect(labels.size).toBe(1)
                expect(entityManager.find).not.toHaveBeenCalled()
                expect(cache.set).not.toHaveBeenCalled()
            })
    })
