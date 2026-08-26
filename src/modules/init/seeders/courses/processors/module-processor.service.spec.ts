import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    ModuleProcessorService,
} from "./module-processor.service"

describe("ModuleProcessorService",
    () => {
        const courseResult = {
            data: {
                id: "course-1",
                displayId: "course",
            },
            index: 0,
            relativePath: "0-course",
        }

        it("persists an empty module partition when no paths exist",
            async () => {
                const persist = jest.fn().mockResolvedValue(undefined)
                const service = new ModuleProcessorService(
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
                        partitionUuidSync: jest.fn().mockResolvedValue({
                            createEntities: [],
                            updateEntities: [],
                            deleteEntities: [],
                        }),
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: jest.fn(),
                    } as never,
                )

                await service.process({
                    courseResult,
                    moduleIndexFilterByDisplayId: null,
                })

                expect(persist).toHaveBeenCalled()
            })

        it("parses modules, skips malformed files, filters partitions, and processes contents",
            async () => {
                const parse = jest.fn()
                    .mockResolvedValueOnce({
                        id: "module-0",
                        orderIndex: 0,
                    })
                    .mockRejectedValueOnce(new Error("invalid module markdown"))
                const paths = jest.fn().mockResolvedValue([
                    {
                        orderIndex: 0,
                        relativePath: "0-course/0-module",
                    },
                    {
                        orderIndex: 1,
                        relativePath: "0-course/1-module",
                    },
                ])
                const partition = {
                    createEntities: [{
                        id: "module-0",
                        orderIndex: 0,
                    }],
                    updateEntities: [{
                        id: "module-1",
                        orderIndex: 1,
                    }],
                    deleteEntities: [{
                        id: "module-2",
                        orderIndex: 1,
                    }],
                }
                const partitionUuidSync = jest.fn().mockResolvedValue(partition)
                const persist = jest.fn().mockResolvedValue(undefined)
                const processContent = jest.fn().mockResolvedValue(undefined)
                const winston = {
                    log: jest.fn(),
                }
                const service = new ModuleProcessorService(
                    {
                        parse,
                    } as never,
                    {
                        paths,
                    } as never,
                    winston as never,
                    {
                        partitionUuidSync,
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: processContent,
                    } as never,
                )
                const filter = new Map([
                    ["course",
                        new Set([0])],
                ])

                await service.process({
                    courseResult,
                    moduleIndexFilterByDisplayId: filter,
                })

                expect(parse).toHaveBeenCalledTimes(2)
                expect(winston.log).toHaveBeenCalledTimes(1)
                expect(partitionUuidSync).toHaveBeenCalledWith(
                    expect.objectContaining({
                        entityClass: ModuleEntity,
                        where: {
                            course: {
                                id: "course-1",
                            },
                        },
                    }),
                )
                const persistedPartition = persist.mock.calls[0][0] as {
                    partition: {
                        createEntities: Array<{ id: string }>
                        updateEntities: Array<{ id: string }>
                        deleteEntities: Array<{ id: string }>
                    }
                }
                expect(persistedPartition.partition).toEqual({
                    createEntities: [{
                        id: "module-0",
                        orderIndex: 0,
                    }],
                    updateEntities: [],
                    deleteEntities: [],
                })
                expect(processContent).toHaveBeenCalledWith({
                    courseResult,
                    moduleResult: {
                        data: {
                            id: "module-0",
                            orderIndex: 0,
                            course: {
                                id: "course-1",
                                displayId: "course",
                            },
                        },
                        index: 0,
                        relativePath: "0-course/0-module",
                    },
                })
            })

        it("persists and processes every parsed module when no filter is supplied",
            async () => {
                const parse = jest.fn().mockResolvedValue({
                    id: "module-0",
                    orderIndex: 0,
                })
                const persist = jest.fn().mockResolvedValue(undefined)
                const processContent = jest.fn().mockResolvedValue(undefined)
                const service = new ModuleProcessorService(
                    {
                        parse,
                    } as never,
                    {
                        paths: jest.fn().mockResolvedValue([{
                            orderIndex: 0,
                            relativePath: "module-0",
                        }]),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                        partitionUuidSync: jest.fn().mockResolvedValue({
                            createEntities: [{
                                id: "module-0",
                                orderIndex: 0,
                            }],
                            updateEntities: [],
                            deleteEntities: [],
                        }),
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: processContent,
                    } as never,
                )

                await service.process({
                    courseResult,
                    moduleIndexFilterByDisplayId: null,
                })

                expect(persist).toHaveBeenCalledTimes(1)
                expect(processContent).toHaveBeenCalledTimes(1)
            })
    })
