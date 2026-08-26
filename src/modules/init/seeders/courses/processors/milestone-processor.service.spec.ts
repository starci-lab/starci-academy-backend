import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    MilestoneProcessorService,
} from "./milestone-processor.service"

describe("MilestoneProcessorService",
    () => {
        const courseResult = {
            data: {
                displayId: "course",
            },
            index: 2,
            relativePath: "2-course",
        }

        it("parses, persists, and delegates retained milestone tasks",
            async () => {
                const milestonePath = {
                    orderIndex: 1,
                    relativePath: "2-course/milestones/1-milestone",
                }
                const milestone = {
                    id: "milestone-1",
                }
                const partition = {
                    createEntities: [milestone],
                    updateEntities: [],
                    deleteEntities: [{
                        id: "milestone-old",
                    }],
                }
                const parse = jest.fn().mockResolvedValue(milestone)
                const partitionUuidSync = jest.fn().mockResolvedValue(partition)
                const persist = jest.fn().mockResolvedValue(undefined)
                const processTask = jest.fn().mockResolvedValue(undefined)
                const service = new MilestoneProcessorService(
                    {
                        parse,
                    } as never,
                    {
                        paths: jest.fn().mockResolvedValue([milestonePath]),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                        partitionUuidSync,
                    } as never,
                    {
                        process: persist,
                    } as never,
                    {
                        process: processTask,
                    } as never,
                )

                await service.process({
                    courseId: "course-id",
                    courseDisplayId: "course",
                    courseResult,
                })

                expect(parse).toHaveBeenCalledWith({
                    paths: [milestonePath],
                    courseIndex: 2,
                    milestoneIndex: 1,
                })
                expect(partitionUuidSync).toHaveBeenCalledWith({
                    entityClass: MilestoneEntity,
                    entities: [{
                        id: "milestone-1",
                        course: {
                            id: "course-id",
                            displayId: "course",
                        },
                    }],
                    where: {
                        course: {
                            id: "course-id",
                        },
                    },
                })
                expect(persist).toHaveBeenCalledWith({
                    entityClass: MilestoneEntity,
                    partition,
                })
                expect(processTask).toHaveBeenCalledWith({
                    courseId: "course-id",
                    courseResult,
                    milestoneResult: {
                        data: {
                            id: "milestone-1",
                            course: {
                                id: "course-id",
                                displayId: "course",
                            },
                        },
                        index: 1,
                        relativePath: milestonePath.relativePath,
                    },
                })
            })

        it("keeps the empty partition synchronized without nested tasks",
            async () => {
                const partition = {
                    createEntities: [],
                    updateEntities: [],
                    deleteEntities: [],
                }
                const persist = jest.fn().mockResolvedValue(undefined)
                const processTask = jest.fn()
                const service = new MilestoneProcessorService(
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
                        process: processTask,
                    } as never,
                )

                await service.process({
                    courseId: "course-id",
                    courseDisplayId: "course",
                    courseResult,
                })

                expect(persist).toHaveBeenCalledWith({
                    entityClass: MilestoneEntity,
                    partition,
                })
                expect(processTask).not.toHaveBeenCalled()
            })

        it("logs parser failures and stops before persistence",
            async () => {
                const failure = new Error("milestone markdown invalid")
                const partitionUuidSync = jest.fn()
                const log = jest.fn()
                const service = new MilestoneProcessorService(
                    {
                        parse: jest.fn().mockRejectedValue(failure),
                    } as never,
                    {
                        paths: jest.fn().mockResolvedValue([{
                            orderIndex: 0,
                            relativePath: "2-course/milestones/0-invalid",
                        }]),
                    } as never,
                    {
                        log,
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
                    courseId: "course-id",
                    courseDisplayId: "course",
                    courseResult,
                })).resolves.toBeUndefined()
                expect(log).toHaveBeenCalledTimes(1)
                expect(partitionUuidSync).not.toHaveBeenCalled()
            })
    })
