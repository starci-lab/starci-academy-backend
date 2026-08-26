import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import type {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    MoreThan,
} from "typeorm"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    IndexerSynchronizerService,
} from "./indexer-synchronizer.service"
import type {
    SynchronizerSyncScope,
} from "../../types/context"

/** displayId of the only course the scope enables. */
const ENABLED_COURSE = "fullstack-mastery"
/** displayId of a course the scope leaves switched off. */
const DISABLED_COURSE = "system-design-mastery"

/** One `buildIndexerById` stub per builder the synchronizer drives. */
interface BuilderStub {
    /** Programmed per-test: resolves on success, rejects to exercise the catch. */
    buildIndexerById: jest.Mock
}

describe("IndexerSynchronizerService",
    () => {
        let service: IndexerSynchronizerService
        let entityManager: EntityManagerMock
        let winstonService: {
            log: jest.Mock
        }
        let builders: Record<string, BuilderStub>
        /** Rows the fake entity manager hands back, keyed by entity class name. */
        let rows: Map<string, Array<Record<string, unknown>>>

        /** Every entity kind the indexer synchronizer walks. */
        const entityNames = [
            CourseEntity.name,
            ChallengeEntity.name,
            ContentEntity.name,
            ModuleEntity.name,
            MilestoneEntity.name,
            MilestoneTaskEntity.name,
            FlashcardDeckEntity.name,
        ]

        /**
         * Program the rows one entity kind yields, in `id ASC` order.
         *
         * @param entityName - Entity class name the synchronizer queries
         * @param entityRows - Rows to hand back one call at a time
         */
        const programRows = (
            entityName: string,
            entityRows: Array<Record<string, unknown>>,
        ): void => {
            rows.set(entityName,
                entityRows.map((row) => ({
                    ...row,
                })))
        }

        /** Ids passed to one kind's builder, in call order. */
        const builtIds = (entityName: string): Array<unknown> =>
            builders[entityName].buildIndexerById.mock.calls.map(([
                id,
            ]) => id)

        /** One in-scope row per entity kind. */
        const programEveryKind = (): void => {
            programRows(CourseEntity.name,
                [
                    {
                        id: "course-1",
                        displayId: ENABLED_COURSE,
                    },
                ])
            programRows(ChallengeEntity.name,
                [
                    {
                        id: "challenge-1",
                        displayId: "challenge-1",
                        verified: new Date(),
                        content: {
                            displayId: "content-1",
                            module: {
                                displayId: "module-1",
                                orderIndex: 0,
                                course: {
                                    displayId: ENABLED_COURSE,
                                },
                            },
                        },
                    },
                ])
            programRows(ContentEntity.name,
                [
                    {
                        id: "content-1",
                        displayId: "content-1",
                        verified: new Date(),
                        module: {
                            displayId: "module-1",
                            orderIndex: 0,
                            course: {
                                displayId: ENABLED_COURSE,
                            },
                        },
                    },
                ])
            programRows(ModuleEntity.name,
                [
                    {
                        id: "module-1",
                        displayId: "module-1",
                        orderIndex: 0,
                        course: {
                            displayId: ENABLED_COURSE,
                        },
                    },
                ])
            programRows(MilestoneEntity.name,
                [
                    {
                        id: "milestone-1",
                        orderIndex: 0,
                        course: {
                            displayId: ENABLED_COURSE,
                        },
                    },
                ])
            programRows(MilestoneTaskEntity.name,
                [
                    {
                        id: "task-1",
                        verified: new Date(),
                        milestone: {
                            orderIndex: 0,
                            course: {
                                displayId: ENABLED_COURSE,
                            },
                        },
                    },
                ])
            programRows(FlashcardDeckEntity.name,
                [
                    {
                        id: "deck-1",
                    },
                ])
        }

        /** A scope that admits every kind and every row. */
        const fullScope = (): SynchronizerSyncScope => ({
            courseEnabledByDisplayId: new Map([
                [
                    ENABLED_COURSE,
                    true,
                ],
            ]),
            moduleIndexFilterByDisplayId: null,
            milestoneIndexFilterByDisplayId: null,
            foundations: true,
            headhunting: true,
            flashcards: true,
            codingProblems: true,
        })

        beforeEach(() => {
            rows = new Map()
            entityManager = makeEntityManagerMock()
            entityManager.findOne.mockImplementation(
                async (entityClass: {
                    name: string
                }) => rows.get(entityClass.name)?.shift() ?? null,
            )

            builders = {
            }
            for (const entityName of entityNames) {
                builders[entityName] = {
                    buildIndexerById: jest.fn().mockResolvedValue(undefined),
                }
            }

            winstonService = {
                log: jest.fn(),
            }

            service = new IndexerSynchronizerService(
                new DayjsService(),
                winstonService as unknown as WinstonService,
                asEntityManager(entityManager),
                builders[CourseEntity.name] as never,
                builders[ModuleEntity.name] as never,
                builders[ContentEntity.name] as never,
                builders[ChallengeEntity.name] as never,
                builders[MilestoneEntity.name] as never,
                builders[MilestoneTaskEntity.name] as never,
                builders[FlashcardDeckEntity.name] as never,
            )
        })

        describe("sync",
            () => {
                it("projects one document per row for every supported kind",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                        expect(builtIds(ChallengeEntity.name)).toEqual([
                            "challenge-1",
                        ])
                        expect(builtIds(ContentEntity.name)).toEqual([
                            "content-1",
                        ])
                        expect(builtIds(ModuleEntity.name)).toEqual([
                            "module-1",
                        ])
                        expect(builtIds(MilestoneEntity.name)).toEqual([
                            "milestone-1",
                        ])
                        expect(builtIds(MilestoneTaskEntity.name)).toEqual([
                            "task-1",
                        ])
                        expect(builtIds(FlashcardDeckEntity.name)).toEqual([
                            "deck-1",
                        ])
                    })

                it("logs the module success payload with its parent course",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind: ModuleEntity.name,
                                entityId: "module-1",
                                displayId: "module-1",
                                relativeDisplayIds: [
                                    ENABLED_COURSE,
                                ],
                            },
                        )
                    })

                it("emits the done log last",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        const doneCall = winstonService.log.mock.calls.at(-1)
                        expect(doneCall?.[0]).toBe(WinstonLog.IndexerSynchronizerSyncDone)
                        expect(doneCall?.[1].durationMs).toBeGreaterThanOrEqual(0)
                    })

                it("resumes after the previous row instead of re-reading it",
                    async () => {
                        programRows(ContentEntity.name,
                            [
                                {
                                    id: "content-1",
                                    displayId: "content-1",
                                    verified: new Date(),
                                    module: {
                                        displayId: "module-1",
                                        orderIndex: 0,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                                {
                                    id: "content-2",
                                    displayId: "content-2",
                                    verified: null,
                                    module: {
                                        displayId: "module-1",
                                        orderIndex: 0,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                            ])

                        await service.sync(fullScope())

                        const contentCalls = entityManager.findOne.mock.calls.filter(
                            ([
                                entityClass,
                            ]) => entityClass === ContentEntity,
                        )
                        expect(contentCalls[0][1].where).toEqual({
                        })
                        expect(contentCalls[1][1].where.id).toEqual(
                            MoreThan("content-1"),
                        )
                        expect(builtIds(ContentEntity.name)).toEqual([
                            "content-1",
                            "content-2",
                        ])
                        // a row with no `verified` timestamp is flagged as legacy mount
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            expect.objectContaining({
                                entityId: "content-2",
                                isLegacy: true,
                            }),
                        )
                    })

                it("skips out-of-scope rows and keeps walking past them",
                    async () => {
                        programRows(CourseEntity.name,
                            [
                                {
                                    id: "course-off",
                                    displayId: DISABLED_COURSE,
                                },
                                {
                                    id: "course-1",
                                    displayId: ENABLED_COURSE,
                                },
                            ])
                        programRows(ChallengeEntity.name,
                            [
                                {
                                    id: "challenge-off",
                                    displayId: "challenge-off",
                                    verified: null,
                                    content: {
                                        module: {
                                            orderIndex: 9,
                                            course: {
                                                displayId: ENABLED_COURSE,
                                            },
                                        },
                                    },
                                },
                            ])
                        programRows(ContentEntity.name,
                            [
                                {
                                    id: "content-off",
                                    displayId: "content-off",
                                    verified: null,
                                    module: {
                                        orderIndex: 9,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                            ])
                        programRows(ModuleEntity.name,
                            [
                                {
                                    id: "module-off",
                                    displayId: "module-off",
                                    orderIndex: 9,
                                    course: {
                                        displayId: ENABLED_COURSE,
                                    },
                                },
                            ])
                        programRows(MilestoneEntity.name,
                            [
                                {
                                    id: "milestone-off",
                                    orderIndex: 9,
                                    course: {
                                        displayId: ENABLED_COURSE,
                                    },
                                },
                            ])
                        programRows(MilestoneTaskEntity.name,
                            [
                                {
                                    id: "task-off",
                                    verified: null,
                                    milestone: {
                                        orderIndex: 9,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                            ])

                        const scope = fullScope()
                        scope.moduleIndexFilterByDisplayId = new Map([
                            [
                                ENABLED_COURSE,
                                new Set([
                                    0,
                                ]),
                            ],
                        ])
                        scope.milestoneIndexFilterByDisplayId = new Map([
                            [
                                ENABLED_COURSE,
                                new Set([
                                    0,
                                ]),
                            ],
                        ])

                        await service.sync(scope)

                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                        for (const entityName of [
                            ChallengeEntity.name,
                            ContentEntity.name,
                            ModuleEntity.name,
                            MilestoneEntity.name,
                            MilestoneTaskEntity.name,
                        ]) {
                            expect(builders[entityName].buildIndexerById)
                                .not.toHaveBeenCalled()
                        }
                    })

                it("logs a failure per row and still finishes the run",
                    async () => {
                        programEveryKind()
                        for (const builder of Object.values(builders)) {
                            builder.buildIndexerById.mockRejectedValue(
                                new Error("projection write failed"),
                            )
                        }

                        await service.sync(fullScope())

                        const failures = winstonService.log.mock.calls.filter(
                            ([
                                logKey,
                            ]) => logKey === WinstonLog.IndexerSynchronizerEntitySyncFailed,
                        )
                        expect(failures).toHaveLength(7)
                        expect(failures[0][1]).toEqual({
                            entityKind: CourseEntity.name,
                            entityId: "course-1",
                            error: "projection write failed",
                        })
                        expect(winstonService.log.mock.calls.at(-1)?.[0])
                            .toBe(WinstonLog.IndexerSynchronizerSyncDone)
                    })

                it("skips the standalone flashcard-deck index when its flag is off",
                    async () => {
                        programEveryKind()
                        const scope = fullScope()
                        scope.flashcards = false

                        await service.sync(scope)

                        expect(builders[FlashcardDeckEntity.name].buildIndexerById)
                            .not.toHaveBeenCalled()
                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                    })

                it("does nothing but log when the database holds no rows",
                    async () => {
                        await service.sync(fullScope())

                        for (const builder of Object.values(builders)) {
                            expect(builder.buildIndexerById).not.toHaveBeenCalled()
                        }
                        expect(winstonService.log).toHaveBeenCalledTimes(1)
                    })

                it("continues indexing other rows when one builder rejects",
                    async () => {
                        programRows(
                            CourseEntity.name,
                            [
                                {
                                    id: "course-failing",
                                    displayId: ENABLED_COURSE,
                                },
                                {
                                    id: "course-ok",
                                    displayId: ENABLED_COURSE,
                                },
                            ],
                        )
                        for (const entityName of entityNames.slice(1)) {
                            programRows(
                                entityName,
                                [],
                            )
                        }
                        builders[CourseEntity.name].buildIndexerById
                            .mockRejectedValueOnce(new Error("index failed"))
                            .mockResolvedValueOnce(undefined)

                        await service.sync(fullScope())

                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-failing",
                            "course-ok",
                        ])
                        expect(winstonService.log).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                error: "index failed",
                            }),
                        )
                    })
            })
    })
