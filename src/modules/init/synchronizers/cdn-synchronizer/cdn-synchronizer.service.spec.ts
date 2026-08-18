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
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
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
import type {
    S3BucketService,
} from "@modules/integrations/s3/s3-bucket.service"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    CdnSynchronizerService,
} from "./cdn-synchronizer.service"
import type {
    SynchronizerSyncScope,
} from "../../types/context"

/** displayId of the only course the scope enables. */
const ENABLED_COURSE = "fullstack-mastery"
/** displayId of a course the scope leaves switched off. */
const DISABLED_COURSE = "system-design-mastery"

/** One `materializeAndUpload` stub per builder the synchronizer drives. */
interface BuilderStub {
    /** Programmed per-test: resolves on success, rejects to exercise the catch. */
    materializeAndUpload: jest.Mock
}

describe("CdnSynchronizerService",
    () => {
        let service: CdnSynchronizerService
        let entityManager: EntityManagerMock
        let winstonService: {
            log: jest.Mock
        }
        let builders: Record<string, BuilderStub>
        /** Rows the fake entity manager hands back, keyed by entity class name. */
        let rows: Map<string, Array<Record<string, unknown>>>

        /** Every entity kind the CDN synchronizer walks. */
        const entityNames = [
            CourseEntity.name,
            ChallengeEntity.name,
            ContentEntity.name,
            ModuleEntity.name,
            MilestoneTaskEntity.name,
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
        const uploadedIds = (entityName: string): Array<unknown> =>
            builders[entityName].materializeAndUpload.mock.calls.map(([
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
        }

        /** A scope that admits every row of every kind. */
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
                    materializeAndUpload: jest.fn().mockResolvedValue(undefined),
                }
            }

            winstonService = {
                log: jest.fn(),
            }

            service = new CdnSynchronizerService(
                new DayjsService(),
                winstonService as unknown as WinstonService,
                asEntityManager(entityManager),
                builders[CourseEntity.name] as never,
                builders[ModuleEntity.name] as never,
                builders[ContentEntity.name] as never,
                builders[ChallengeEntity.name] as never,
                builders[MilestoneTaskEntity.name] as never,
                {
                } as unknown as S3BucketService,
            )
        })

        describe("sync",
            () => {
                it("materializes and uploads one object per row for every kind",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        expect(uploadedIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                        expect(uploadedIds(ChallengeEntity.name)).toEqual([
                            "challenge-1",
                        ])
                        expect(uploadedIds(ContentEntity.name)).toEqual([
                            "content-1",
                        ])
                        expect(uploadedIds(ModuleEntity.name)).toEqual([
                            "module-1",
                        ])
                        expect(uploadedIds(MilestoneTaskEntity.name)).toEqual([
                            "task-1",
                        ])
                    })

                it("logs the milestone-task success payload keyed by its primary key",
                    async () => {
                        programEveryKind()

                        await service.sync(fullScope())

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind: MilestoneTaskEntity.name,
                                entityId: "task-1",
                                displayId: "task-1",
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
                        expect(doneCall?.[0]).toBe(WinstonLog.CdnSynchronizerCdnSyncDone)
                        expect(doneCall?.[1].durationMs).toBeGreaterThanOrEqual(0)
                    })

                it("resumes after the previous row instead of re-reading it",
                    async () => {
                        programRows(CourseEntity.name,
                            [
                                {
                                    id: "course-1",
                                    displayId: ENABLED_COURSE,
                                },
                                {
                                    id: "course-2",
                                    displayId: ENABLED_COURSE,
                                },
                            ])

                        await service.sync(fullScope())

                        const courseCalls = entityManager.findOne.mock.calls.filter(
                            ([
                                entityClass,
                            ]) => entityClass === CourseEntity,
                        )
                        expect(courseCalls[0][1].where).toEqual({
                        })
                        expect(courseCalls[1][1].where.id).toBeDefined()
                        expect(uploadedIds(CourseEntity.name)).toEqual([
                            "course-1",
                            "course-2",
                        ])
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

                        expect(uploadedIds(CourseEntity.name)).toEqual([
                            "course-1",
                        ])
                        for (const entityName of [
                            ChallengeEntity.name,
                            ContentEntity.name,
                            ModuleEntity.name,
                            MilestoneTaskEntity.name,
                        ]) {
                            expect(builders[entityName].materializeAndUpload)
                                .not.toHaveBeenCalled()
                        }
                    })

                it("records name, message and stack when a builder throws an Error",
                    async () => {
                        programEveryKind()
                        const failure = new TypeError("cannot read property of undefined")
                        for (const builder of Object.values(builders)) {
                            builder.materializeAndUpload.mockRejectedValue(failure)
                        }

                        await service.sync(fullScope())

                        const failures = winstonService.log.mock.calls.filter(
                            ([
                                logKey,
                            ]) => logKey === WinstonLog.CdnSynchronizerEntitySyncFailed,
                        )
                        expect(failures).toHaveLength(5)
                        expect(failures[0][1]).toEqual({
                            entityKind: CourseEntity.name,
                            entityId: "course-1",
                            errorName: "TypeError",
                            errorMessage: "cannot read property of undefined",
                            errorStack: failure.stack,
                        })
                        expect(winstonService.log.mock.calls.at(-1)?.[0])
                            .toBe(WinstonLog.CdnSynchronizerCdnSyncDone)
                    })

                it("stringifies a non-Error rejection and leaves name and stack unset",
                    async () => {
                        programEveryKind()
                        for (const builder of Object.values(builders)) {
                            builder.materializeAndUpload.mockRejectedValue("upstream 503")
                        }

                        await service.sync(fullScope())

                        const failures = winstonService.log.mock.calls.filter(
                            ([
                                logKey,
                            ]) => logKey === WinstonLog.CdnSynchronizerEntitySyncFailed,
                        )
                        expect(failures).toHaveLength(5)
                        for (const [
                            ,
                            payload,
                        ] of failures) {
                            expect(payload.errorMessage).toBe("upstream 503")
                            expect(payload.errorName).toBeUndefined()
                            expect(payload.errorStack).toBeUndefined()
                        }
                    })

                it("does nothing but log when the database holds no rows",
                    async () => {
                        await service.sync(fullScope())

                        for (const builder of Object.values(builders)) {
                            expect(builder.materializeAndUpload).not.toHaveBeenCalled()
                        }
                        expect(winstonService.log).toHaveBeenCalledTimes(1)
                        expect(winstonService.log.mock.calls[0][0])
                            .toBe(WinstonLog.CdnSynchronizerCdnSyncDone)
                    })
            })
    })
