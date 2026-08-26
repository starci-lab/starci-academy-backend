import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    ContentProcessorService,
} from "./content-processor.service"

describe("ContentProcessorService",
    () => {
        const courseResult = {
            data: {
                displayId: "course",
            },
            index: 2,
            relativePath: "2-course",
        }
        const moduleResult = {
            data: {
                id: "module-id",
                displayId: "module",
            },
            index: 3,
            relativePath: "2-course/modules/3-module",
        }

        it("skips parse failures, persists the partition, and processes retained challenges",
            async () => {
                const paths = [
                    {
                        orderIndex: 0,
                        relativePath: "module/0-content",
                    },
                    {
                        orderIndex: 1,
                        relativePath: "module/1-content",
                    },
                ]
                const parse = jest.fn()
                    .mockResolvedValueOnce({
                        id: "content-keep",
                    })
                    .mockRejectedValueOnce(new Error("invalid content"))
                const partition = {
                    createEntities: [{
                        id: "content-keep",
                    }],
                    updateEntities: [],
                    deleteEntities: [{
                        id: "content-old",
                    }],
                }
                const partitionUuidSync = jest.fn().mockResolvedValue(partition)
                const persist = jest.fn().mockResolvedValue(undefined)
                const processChallenge = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const service = new ContentProcessorService(
                    {
                        parse,
                    } as never,
                    {
                        paths: jest.fn().mockResolvedValue(paths),
                    } as never,
                    {
                        log,
                    } as never,
                    {
                        partitionUuidSync,
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: processChallenge,
                    } as never,
                )

                await service.process({
                    courseResult,
                    moduleResult,
                })

                expect(parse).toHaveBeenCalledTimes(2)
                expect(log).toHaveBeenCalledTimes(1)
                expect(partitionUuidSync).toHaveBeenCalledWith({
                    entityClass: ContentEntity,
                    entities: [{
                        id: "content-keep",
                        module: {
                            id: "module-id",
                            displayId: "module",
                            course: {
                                displayId: "course",
                            },
                        },
                    }],
                    where: {
                        module: {
                            id: "module-id",
                        },
                    },
                })
                expect(persist).toHaveBeenCalledWith({
                    entityClass: ContentEntity,
                    partition,
                })
                expect(processChallenge).toHaveBeenCalledTimes(1)
                expect(processChallenge).toHaveBeenCalledWith(expect.objectContaining({
                    contentResult: expect.objectContaining({
                        data: expect.objectContaining({
                            id: "content-keep",
                        }),
                    }),
                }))
            })

        it("persists an empty content partition without nested work",
            async () => {
                const persist = jest.fn().mockResolvedValue(undefined)
                const processChallenge = jest.fn()
                const partition = {
                    createEntities: [],
                    updateEntities: [],
                    deleteEntities: [],
                }
                const service = new ContentProcessorService(
                    {
                        parse: jest.fn(),
                    } as never,
                    {
                        paths: jest.fn().mockResolvedValue([]),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                        partitionUuidSync: jest.fn().mockResolvedValue(partition),
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: processChallenge,
                    } as never,
                )

                await service.process({
                    courseResult,
                    moduleResult,
                })

                expect(persist).toHaveBeenCalledWith({
                    entityClass: ContentEntity,
                    partition,
                })
                expect(processChallenge).not.toHaveBeenCalled()
            })

        it("propagates a path lookup failure before partitioning",
            async () => {
                const failure = new Error("content directory unavailable")
                const partitionUuidSync = jest.fn()
                const service = new ContentProcessorService(
                    {
                    } as never,
                    {
                        paths: jest.fn().mockRejectedValue(failure),
                    } as never,
                    {
                    } as never,
                    {
                        partitionUuidSync,
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                await expect(service.process({
                    courseResult,
                    moduleResult,
                })).rejects.toBe(failure)
                expect(partitionUuidSync).not.toHaveBeenCalled()
            })
    })
