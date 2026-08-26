import {
    ElasticsearchSynchronizerService
} from "./elasticsearch-synchronizer.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"

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

        it("dispatches every enabled entity kind, ensures both locale indexes, and continues after a builder failure",
            async () => {
                const log = jest.fn()
                const entities = new Map<string, { id: string; displayId?: string; orderIndex?: number; course?: unknown; content?: unknown; module?: unknown; milestone?: unknown }>([
                    [CourseEntity.name,
                        {
                            id: "course", displayId: "course"
                        }],
                    [ChallengeEntity.name,
                        {
                            id: "challenge", content: {
                                module: {
                                    course: {
                                        displayId: "course"
                                    }, orderIndex: 0
                                }
                            }
                        }],
                    [ContentEntity.name,
                        {
                            id: "content", module: {
                                course: {
                                    displayId: "course"
                                }, orderIndex: 0
                            }
                        }],
                    [ModuleEntity.name,
                        {
                            id: "module", orderIndex: 0, course: {
                                displayId: "course"
                            }
                        }],
                    [MilestoneEntity.name,
                        {
                            id: "milestone", orderIndex: 0, course: {
                                displayId: "course"
                            }
                        }],
                    [MilestoneTaskEntity.name,
                        {
                            id: "task", milestone: {
                                orderIndex: 0, course: {
                                    displayId: "course"
                                }
                            }
                        }],
                    [FoundationCategoryEntity.name,
                        {
                            id: "foundation-category"
                        }],
                    [FoundationEntity.name,
                        {
                            id: "foundation"
                        }],
                    [HeadhuntingCompanyEntity.name,
                        {
                            id: "company"
                        }],
                    [ConsultantEntity.name,
                        {
                            id: "consultant"
                        }],
                    [FlashcardDeckEntity.name,
                        {
                            id: "deck"
                        }],
                    [CodingProblemEntity.name,
                        {
                            id: "problem"
                        }],
                ])
                const calls = new Map<string, number>()
                const findOne = jest.fn((entity: { name: string }) => {
                    const count = calls.get(entity.name) ?? 0
                    calls.set(entity.name,
                        count + 1)
                    return Promise.resolve(count === 0 ? entities.get(entity.name) ?? null : null)
                })
                const builder = (failure = false) => ({
                    buildIndexById: failure
                        ? jest.fn().mockRejectedValue(new Error("builder failed"))
                        : jest.fn().mockResolvedValue(undefined),
                })
                const builders = {
                    course: builder(),
                    module: builder(),
                    content: builder(),
                    challenge: builder(),
                    milestone: builder(),
                    task: builder(),
                    foundation: builder(),
                    category: builder(true),
                    company: builder(),
                    consultant: builder(),
                    deck: builder(),
                    problem: builder(),
                }
                const ensureIndexForEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchSynchronizerService(
                    {
                        now: jest.fn().mockReturnValue({
                            diff: jest.fn().mockReturnValue(5)
                        })
                    } as never,
                    {
                        log
                    } as never,
                    {
                        findOne
                    } as never,
                    builders.course as never,
                    builders.module as never,
                    builders.content as never,
                    builders.challenge as never,
                    builders.milestone as never,
                    builders.task as never,
                    builders.foundation as never,
                    builders.category as never,
                    builders.company as never,
                    builders.consultant as never,
                    builders.deck as never,
                    builders.problem as never,
                    {
                        ensureIndexForEntity
                    } as never,
                )

                await service.sync({
                    courseEnabledByDisplayId: new Map([["course",
                        true]]),
                    moduleIndexFilterByDisplayId: null,
                    milestoneIndexFilterByDisplayId: null,
                    foundations: true,
                    headhunting: true,
                    flashcards: true,
                    codingProblems: true,
                })

                const dispatch = service as unknown as {
                    syncEntityKind: (scope: unknown, entityKind: string) => Promise<void>
                }
                await dispatch.syncEntityKind({
                },
                "UnsupportedEntity")

                expect(ensureIndexForEntity).toHaveBeenCalledTimes(24)
                expect(builders.course.buildIndexById).toHaveBeenCalledWith("course")
                expect(builders.module.buildIndexById).toHaveBeenCalledWith("module")
                expect(builders.content.buildIndexById).toHaveBeenCalledWith("content")
                expect(builders.challenge.buildIndexById).toHaveBeenCalledWith("challenge")
                expect(builders.milestone.buildIndexById).toHaveBeenCalledWith("milestone")
                expect(builders.task.buildIndexById).toHaveBeenCalledWith("task")
                expect(builders.foundation.buildIndexById).toHaveBeenCalledWith("foundation")
                expect(builders.category.buildIndexById).toHaveBeenCalledWith("foundation-category")
                expect(builders.company.buildIndexById).toHaveBeenCalledWith("company")
                expect(builders.consultant.buildIndexById).toHaveBeenCalledWith("consultant")
                expect(builders.deck.buildIndexById).toHaveBeenCalledWith("deck")
                expect(builders.problem.buildIndexById).toHaveBeenCalledWith("problem")
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        entityKind: FoundationCategoryEntity.name,
                        entityId: "foundation-category",
                        error: "builder failed",
                    }))
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        entityKind: CodingProblemEntity.name,
                        entityId: "problem",
                    }))
            })
    })
