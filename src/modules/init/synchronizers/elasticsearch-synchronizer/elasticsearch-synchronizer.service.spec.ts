import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
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
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import type {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    asEntityManager,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    ElasticsearchSynchronizerService,
} from "./elasticsearch-synchronizer.service"
import type {
    SynchronizerSyncScope,
} from "../../types/context"

/** displayId of the only course the scope enables. */
const ENABLED_COURSE = "fullstack-mastery"
/** displayId of a course the scope leaves switched off. */
const DISABLED_COURSE = "system-design-mastery"

/** One `buildIndexById` stub per builder the synchronizer drives. */
interface BuilderStub {
    /** Programmed per-test: resolves on success, rejects to exercise the catch. */
    buildIndexById: jest.Mock
}

describe("ElasticsearchSynchronizerService",
    () => {
        let service: ElasticsearchSynchronizerService
        let entityManager: EntityManagerMock
        let winstonService: {
            log: jest.Mock
        }
        let elasticsearchService: {
            ensureIndexForEntity: jest.Mock
        }
        /** Builder stub per entity kind, keyed by the entity class name. */
        let builders: Record<string, BuilderStub>
        /** Rows the fake entity manager hands back, keyed by entity class name. */
        let rows: Map<string, Array<Record<string, unknown>>>

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

        /** A course row the scope allows. */
        const enabledCourse = (id: string) => ({
            id,
            displayId: ENABLED_COURSE,
        })

        /** A module row (with its parent course) the scope allows. */
        const enabledModule = (id: string) => ({
            id,
            displayId: `module-${id}`,
            orderIndex: 0,
            course: {
                displayId: ENABLED_COURSE,
            },
        })

        /** A content row hanging off an allowed module. */
        const enabledContent = (id: string) => ({
            id,
            displayId: `content-${id}`,
            verified: new Date(),
            module: {
                displayId: "module-0",
                orderIndex: 0,
                course: {
                    displayId: ENABLED_COURSE,
                },
            },
        })

        /** A challenge row hanging off an allowed lesson. */
        const enabledChallenge = (id: string) => ({
            id,
            displayId: `challenge-${id}`,
            verified: new Date(),
            content: {
                displayId: "content-0",
                module: {
                    displayId: "module-0",
                    orderIndex: 0,
                    course: {
                        displayId: ENABLED_COURSE,
                    },
                },
            },
        })

        /** A milestone row on an allowed course. */
        const enabledMilestone = (id: string) => ({
            id,
            orderIndex: 0,
            course: {
                displayId: ENABLED_COURSE,
            },
        })

        /** A milestone-task row under an allowed milestone. */
        const enabledMilestoneTask = (id: string) => ({
            id,
            verified: new Date(),
            milestone: {
                orderIndex: 0,
                course: {
                    displayId: ENABLED_COURSE,
                },
            },
        })

        /** A standalone row for the ungated kinds (foundations, headhunting, ...). */
        const standaloneRow = (id: string) => ({
            id,
        })

        /** Every entity kind the synchronizer walks, with a default single row. */
        const programEveryKind = (): void => {
            programRows(CourseEntity.name,
                [
                    enabledCourse("course-1"),
                ])
            programRows(ChallengeEntity.name,
                [
                    enabledChallenge("challenge-1"),
                ])
            programRows(ContentEntity.name,
                [
                    enabledContent("content-1"),
                ])
            programRows(ModuleEntity.name,
                [
                    enabledModule("module-1"),
                ])
            programRows(MilestoneEntity.name,
                [
                    enabledMilestone("milestone-1"),
                ])
            programRows(MilestoneTaskEntity.name,
                [
                    enabledMilestoneTask("task-1"),
                ])
            programRows(FoundationCategoryEntity.name,
                [
                    standaloneRow("category-1"),
                ])
            programRows(FoundationEntity.name,
                [
                    standaloneRow("foundation-1"),
                ])
            programRows(HeadhuntingCompanyEntity.name,
                [
                    standaloneRow("company-1"),
                ])
            programRows(ConsultantEntity.name,
                [
                    standaloneRow("consultant-1"),
                ])
            programRows(FlashcardDeckEntity.name,
                [
                    standaloneRow("deck-1"),
                ])
            programRows(CodingProblemEntity.name,
                [
                    standaloneRow("problem-1"),
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

        /** Every builder call this run made, as `entityKind -> ids`. */
        const builtIds = (entityName: string): Array<unknown> =>
            builders[entityName].buildIndexById.mock.calls.map(([
                id,
            ]) => id)

        beforeEach(() => {
            rows = new Map()
            entityManager = makeEntityManagerMock()
            // hand back the next programmed row per entity kind, then null to break
            entityManager.findOne.mockImplementation(
                async (entityClass: {
                    name: string
                }) => rows.get(entityClass.name)?.shift() ?? null,
            )

            builders = {
            }
            for (const entityName of [
                CourseEntity.name,
                ChallengeEntity.name,
                ContentEntity.name,
                ModuleEntity.name,
                MilestoneEntity.name,
                MilestoneTaskEntity.name,
                FoundationCategoryEntity.name,
                FoundationEntity.name,
                HeadhuntingCompanyEntity.name,
                ConsultantEntity.name,
                FlashcardDeckEntity.name,
                CodingProblemEntity.name,
            ]) {
                builders[entityName] = {
                    buildIndexById: jest.fn().mockResolvedValue(undefined),
                }
            }

            winstonService = {
                log: jest.fn(),
            }
            elasticsearchService = {
                ensureIndexForEntity: jest.fn().mockResolvedValue(undefined),
            }

            service = new ElasticsearchSynchronizerService(
                new DayjsService(),
                winstonService as unknown as WinstonService,
                asEntityManager(entityManager),
                builders[CourseEntity.name] as never,
                builders[ModuleEntity.name] as never,
                builders[ContentEntity.name] as never,
                builders[ChallengeEntity.name] as never,
                builders[MilestoneEntity.name] as never,
                builders[MilestoneTaskEntity.name] as never,
                builders[FoundationEntity.name] as never,
                builders[FoundationCategoryEntity.name] as never,
                builders[HeadhuntingCompanyEntity.name] as never,
                builders[ConsultantEntity.name] as never,
                builders[FlashcardDeckEntity.name] as never,
                builders[CodingProblemEntity.name] as never,
                elasticsearchService as unknown as ElasticsearchService,
            )
        })

        describe("sync",
            () => {
                it("ensures the index per kind and locale before re-indexing",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        // 12 kinds x 2 locales, and never a whole-index delete
                        expect(elasticsearchService.ensureIndexForEntity)
                            .toHaveBeenCalledTimes(24)
                        expect(elasticsearchService.ensureIndexForEntity)
                            .toHaveBeenCalledWith({
                                entity: CourseEntity.name,
                                locale: Locale.En,
                            })
                        expect(elasticsearchService.ensureIndexForEntity)
                            .toHaveBeenCalledWith({
                                entity: CodingProblemEntity.name,
                                locale: Locale.Vi,
                            })
                    })

                it("indexes one document per row for every supported kind",
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
                        expect(builtIds(FoundationCategoryEntity.name)).toEqual([
                            "category-1",
                        ])
                        expect(builtIds(FoundationEntity.name)).toEqual([
                            "foundation-1",
                        ])
                        expect(builtIds(HeadhuntingCompanyEntity.name)).toEqual([
                            "company-1",
                        ])
                        expect(builtIds(ConsultantEntity.name)).toEqual([
                            "consultant-1",
                        ])
                        expect(builtIds(FlashcardDeckEntity.name)).toEqual([
                            "deck-1",
                        ])
                        expect(builtIds(CodingProblemEntity.name)).toEqual([
                            "problem-1",
                        ])
                    })

                it("logs the course success payload with its displayId",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind: CourseEntity.name,
                                entityId: "course-1",
                                displayId: ENABLED_COURSE,
                                relativeDisplayIds: [],
                            },
                        )
                    })

                it("emits the done log once the walk completes",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        const doneCall = winstonService.log.mock.calls.at(-1)
                        expect(doneCall?.[0]).toBe(WinstonLog.EsSynchronizerSyncDone)
                        expect(typeof doneCall?.[1].durationMs).toBe("number")
                        expect(doneCall?.[1].durationMs).toBeGreaterThanOrEqual(0)
                    })

                it("resumes after the previous row instead of re-reading it",
                    async () => {
                        programRows(CourseEntity.name,
                            [
                                enabledCourse("course-1"),
                                enabledCourse("course-2"),
                            ])

                        await service.sync(fullScope())

                        const courseCalls = entityManager.findOne.mock.calls.filter(
                            ([
                                entityClass,
                            ]) => entityClass === CourseEntity,
                        )
                        // first read is unbounded, later reads carry a MoreThan cursor
                        expect(courseCalls[0][1].where).toEqual({
                        })
                        expect(courseCalls[1][1].where.id).toBeDefined()
                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-1",
                            "course-2",
                        ])
                    })

                it("skips rows the scope excludes but keeps walking past them",
                    async () => {
                        programRows(CourseEntity.name,
                            [
                                {
                                    id: "course-off",
                                    displayId: DISABLED_COURSE,
                                },
                                enabledCourse("course-1"),
                            ])
                        programRows(ChallengeEntity.name,
                            [
                                {
                                    id: "challenge-off",
                                    displayId: "challenge-off",
                                    verified: null,
                                    content: {
                                        module: {
                                            orderIndex: 4,
                                            course: {
                                                displayId: ENABLED_COURSE,
                                            },
                                        },
                                    },
                                },
                                enabledChallenge("challenge-1"),
                            ])
                        programRows(ContentEntity.name,
                            [
                                {
                                    id: "content-off",
                                    displayId: "content-off",
                                    verified: null,
                                    module: {
                                        orderIndex: 4,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                                enabledContent("content-1"),
                            ])
                        programRows(ModuleEntity.name,
                            [
                                {
                                    id: "module-off",
                                    displayId: "module-off",
                                    orderIndex: 4,
                                    course: {
                                        displayId: ENABLED_COURSE,
                                    },
                                },
                                enabledModule("module-1"),
                            ])
                        programRows(MilestoneEntity.name,
                            [
                                {
                                    id: "milestone-off",
                                    orderIndex: 4,
                                    course: {
                                        displayId: ENABLED_COURSE,
                                    },
                                },
                                enabledMilestone("milestone-1"),
                            ])
                        programRows(MilestoneTaskEntity.name,
                            [
                                {
                                    id: "task-off",
                                    verified: null,
                                    milestone: {
                                        orderIndex: 4,
                                        course: {
                                            displayId: ENABLED_COURSE,
                                        },
                                    },
                                },
                                enabledMilestoneTask("task-1"),
                            ])

                        // only module/milestone index 0 is in scope
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
                    })

                it("logs a failure per row and keeps indexing the rest",
                    async () => {
                        programEveryKind()
                        for (const builder of Object.values(builders)) {
                            builder.buildIndexById.mockRejectedValue(
                                new Error("es bulk timeout"),
                            )
                        }

                        await service.sync(fullScope())

                        const failures = winstonService.log.mock.calls.filter(
                            ([
                                logKey,
                            ]) => logKey === WinstonLog.EsSynchronizerEntitySyncFailed,
                        )
                        expect(failures).toHaveLength(12)
                        expect(failures[0][1]).toEqual({
                            entityKind: CourseEntity.name,
                            entityId: "course-1",
                            error: "es bulk timeout",
                        })
                        // the run still reaches its done log
                        expect(winstonService.log.mock.calls.at(-1)?.[0])
                            .toBe(WinstonLog.EsSynchronizerSyncDone)
                    })

                it("skips whole kinds whose track flag is off",
                    async () => {
                        programEveryKind()
                        const scope = fullScope()
                        scope.foundations = false
                        scope.headhunting = false
                        scope.flashcards = false
                        scope.codingProblems = false

                        await service.sync(scope)

                        for (const entityName of [
                            FoundationCategoryEntity.name,
                            FoundationEntity.name,
                            HeadhuntingCompanyEntity.name,
                            ConsultantEntity.name,
                            FlashcardDeckEntity.name,
                            CodingProblemEntity.name,
                        ]) {
                            expect(builders[entityName].buildIndexById)
                                .not.toHaveBeenCalled()
                            expect(elasticsearchService.ensureIndexForEntity)
                                .not.toHaveBeenCalledWith({
                                    entity: entityName,
                                    locale: Locale.En,
                                })
                        }
                        // the course track is untouched by the sink switches
                        expect(builtIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                    })

                it("does nothing but log when the database holds no rows",
                    async () => {
                        await service.sync(fullScope())

                        for (const builder of Object.values(builders)) {
                            expect(builder.buildIndexById).not.toHaveBeenCalled()
                        }
                        expect(winstonService.log).toHaveBeenCalledTimes(1)
                        expect(winstonService.log.mock.calls[0][0])
                            .toBe(WinstonLog.EsSynchronizerSyncDone)
                    })
            })
    })
