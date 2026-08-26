import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ElasticsearchIndexResetService,
} from "./elasticsearch-index-reset.service"

describe("ElasticsearchIndexResetService",
    () => {
        it("returns without work when no requested entity has an index",
            async () => {
                const allMustDone = jest.fn()
                const service = new ElasticsearchIndexResetService(
                    {
                    } as never,
                    {
                        allMustDone
                    } as never,
                    {
                        log: jest.fn()
                    } as never,
                )

                await expect(service.resetIndices(["UnknownEntity"])).resolves.toBeUndefined()

                expect(allMustDone).not.toHaveBeenCalled()
            })

        it("deletes and recreates every localized index while ignoring unknown names",
            async () => {
                const indicateName = jest.fn((params: { entity: string; locale?: string }) =>
                    `${params.entity}:${params.locale ?? "base"}`)
                const deleteIndex = jest.fn().mockResolvedValue(undefined)
                const ensureIndexForEntity = jest.fn().mockResolvedValue(undefined)
                const allMustDone = jest.fn(async (tasks: Array<Promise<void>>) => Promise.all(tasks))
                const log = jest.fn()
                const service = new ElasticsearchIndexResetService(
                    {
                        indicateName, deleteIndex, ensureIndexForEntity
                    } as never,
                    {
                        allMustDone
                    } as never,
                    {
                        log
                    } as never,
                )

                await service.resetIndices([CourseEntity.name,
                    "UnknownEntity"])

                expect(allMustDone).toHaveBeenCalledTimes(1)
                expect(indicateName).toHaveBeenCalledTimes(3)
                expect(deleteIndex).toHaveBeenCalledWith(`${CourseEntity.name}:base`)
                expect(ensureIndexForEntity).toHaveBeenCalledWith({
                    entity: CourseEntity.name,
                    locale: undefined,
                })
                expect(log).toHaveBeenCalledTimes(2)
            })

        it("resets all configured indices through the same reset path",
            async () => {
                const allMustDone = jest.fn(async (tasks: Array<Promise<void>>) => Promise.all(tasks))
                const service = new ElasticsearchIndexResetService(
                    {
                        indicateName: jest.fn((params: { entity: string; locale?: string }) =>
                            `${params.entity}:${params.locale ?? "base"}`),
                        deleteIndex: jest.fn().mockResolvedValue(undefined),
                        ensureIndexForEntity: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    {
                        allMustDone
                    } as never,
                    {
                        log: jest.fn()
                    } as never,
                )

                await service.resetAllIndices()

                expect(allMustDone).toHaveBeenCalledTimes(1)
                expect(allMustDone.mock.calls[0]?.[0]).toEqual(expect.any(Array))
            })
    })
