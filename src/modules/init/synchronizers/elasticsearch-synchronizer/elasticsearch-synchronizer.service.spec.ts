import {
    ElasticsearchSynchronizerService
} from "./elasticsearch-synchronizer.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"

describe("ElasticsearchSynchronizerService",
    () => {
        it("completes an empty scoped synchronization and records completion",
            async () => {
                const log = jest.fn()
                const service = new ElasticsearchSynchronizerService(
            {
                now: jest.fn().mockReturnValue({
                    diff: jest.fn().mockReturnValue(2)
                })
            } as never,
            {
                log
            } as never,
            {
                findOne: jest.fn().mockResolvedValue(null)
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
            } as never,
            {
                ensureIndexForEntity: jest.fn()
            } as never,
                )

                await service.sync({
                } as never)

                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        doneAt: expect.anything()
                    }))
            })

        it("syncs an enabled course and records its builder result",
            async () => {
                const log = jest.fn()
                const buildIndexById = jest.fn().mockResolvedValue(undefined)
                const course = {
                    id: "course-1",
                    displayId: "course-one",
                }
                let courseReturned = false
                const findOne = jest.fn((entity: { name: string }) => {
                    if (entity.name === CourseEntity.name && !courseReturned) {
                        courseReturned = true
                        return Promise.resolve(course)
                    }
                    return Promise.resolve(null)
                })
                const service = new ElasticsearchSynchronizerService(
                    {
                        now: jest.fn().mockReturnValue({
                            diff: jest.fn().mockReturnValue(2),
                        }),
                    } as never,
                    {
                        log
                    } as never,
                    {
                        findOne
                    } as never,
                    {
                        buildIndexById
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                        ensureIndexForEntity: jest.fn()
                    } as never,
                )

                await service.sync({
                    courseEnabledByDisplayId: new Map([["course-one",
                        true]]),
                    moduleIndexFilterByDisplayId: null,
                    milestoneIndexFilterByDisplayId: null,
                    foundations: true,
                    headhunting: true,
                    flashcards: true,
                    codingProblems: true,
                })

                expect(buildIndexById).toHaveBeenCalledWith("course-1")
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        entityId: "course-1",
                    }))
            })
    })
