import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    PersonalProjectProgressService,
} from "./personal-project.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import type {
    MilestoneTaskProgressCacheResult,
} from "@modules/integrations/cache/types/cache-results/milestone-task-progress"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    ProgressEnrollmentType,
} from "./types/progress"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Fraction of a task's max score the latest attempt must reach to pass. */
const PASS_THRESHOLD = 0.5

/**
 * Build a milestone task row (the grading template) with its `milestone`
 * relation already attached.
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A milestone-task-shaped object usable as a `find` return row.
 */
const buildMilestoneTask = (
    overrides: Partial<{ id: string; maxScore: number }> = {
    },
): { id: string; maxScore: number } => ({
    id: "task-1",
    maxScore: 100,
    ...overrides,
})

/**
 * Build a single attempt row for a user milestone task.
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns An attempt-shaped object.
 */
const buildAttempt = (
    overrides: Partial<{ attemptNumber: number; score: number | null }> = {
    },
): { attemptNumber: number; score: number | null } => ({
    attemptNumber: 1,
    score: 100,
    ...overrides,
})

describe("PersonalProjectProgressService",
    () => {
        let module: TestingModule
        let service: PersonalProjectProgressService
        let cacheService: jest.Mocked<CacheService>
        let entityManager: EntityManagerMock
        let mountStorageService: { appConfig: unknown }

        const enrollment: ProgressEnrollmentType = {
            courseId: "course-1",
            enrollmentId: "enrollment-1",
        }

        beforeEach(async () => {
            // cache stubs -- programmed per-test for hit / miss behavior
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            // fresh entity manager with happy-path defaults (find -> [], findOne -> null)
            entityManager = makeEntityManagerMock()

            // mount config exposes the task pass threshold as a plain getter property
            mountStorageService = {
                appConfig: {
                    systemConfig: {
                        task: {
                            passThreshold: PASS_THRESHOLD,
                        },
                    },
                },
            }

            module = await Test.createTestingModule({
                providers: [
                    PersonalProjectProgressService,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: MountStorageService,
                        useValue: mountStorageService,
                    },
                ],
            }).compile()

            service = module.get<PersonalProjectProgressService>(
                PersonalProjectProgressService,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getProgress",
            () => {
                it("returns the cached payload on a hit and never touches the database",
                    async () => {
                        const cached: MilestoneTaskProgressCacheResult = {
                            completionTasks: [
                                {
                                    id: "task-1",
                                    lastScore: 100,
                                    maxScore: 100,
                                    completed: true,
                                    numAttempts: 1,
                                },
                            ],
                            currentTask: null,
                        }
                        cacheService.get.mockResolvedValueOnce(cached)

                        const result = await service.getProgress(enrollment)

                        expect(result).toBe(cached)
                        expect(cacheService.get).toHaveBeenCalledWith({
                            key: CacheKey.MilestoneTaskProgress,
                            args: [enrollment.enrollmentId],
                        })
                        // a hit short-circuits the DB compute and the re-cache write
                        expect(entityManager.find).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("recomputes when the cache returns a value missing completionTasks",
                    async () => {
                        // a malformed cache row must fall through to compute
                        cacheService.get.mockResolvedValueOnce({
                        } as unknown as MilestoneTaskProgressCacheResult)
                        // no tasks in the course -> empty result
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual({
                            completionTasks: [],
                            currentTask: null,
                        })
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.MilestoneTaskProgress,
                            args: [enrollment.enrollmentId],
                            cacheResult: result,
                        })
                    })

                it("computes from DB on a miss and stores the result",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // first find -> milestone tasks
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask(),
                        ])
                        // findOne -> the user's task row exists
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-1",
                        })
                        // second find -> attempts for that user task
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt(),
                        ])

                        const result = await service.getProgress(enrollment)

                        expect(result.completionTasks).toEqual([
                            {
                                id: "task-1",
                                lastScore: 100,
                                maxScore: 100,
                                completed: true,
                                numAttempts: 1,
                            },
                        ])
                        // every task completed -> no "current" (next unfinished) task
                        expect(result.currentTask).toBeNull()
                        expect(cacheService.set).toHaveBeenCalled()
                    })
            })

        describe("updateProgress",
            () => {
                it("recomputes from DB and writes the result to cache",
                    async () => {
                        // no tasks -> trivial recompute, but the cache write must still happen
                        entityManager.find.mockResolvedValueOnce([])

                        await service.updateProgress(enrollment)

                        // updateProgress never reads cache -- it always recomputes
                        expect(cacheService.get).not.toHaveBeenCalled()
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.MilestoneTaskProgress,
                            args: [enrollment.enrollmentId],
                            cacheResult: {
                                completionTasks: [],
                                currentTask: null,
                            },
                        })
                    })
            })

        describe("invalidateProgress",
            () => {
                it("deletes the cached entry for the enrollment",
                    async () => {
                        await service.invalidateProgress(enrollment.enrollmentId)

                        expect(cacheService.del).toHaveBeenCalledWith({
                            key: CacheKey.MilestoneTaskProgress,
                            args: [enrollment.enrollmentId],
                        })
                    })
            })

        describe("computeProgress branches",
            () => {
                it("marks a task with no user row as the current (first unfinished) task",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask(),
                        ])
                        // findOne -> user never started this task
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task).toEqual({
                            id: "task-1",
                            lastScore: 0,
                            maxScore: 100,
                            completed: false,
                            numAttempts: 0,
                        })
                        // first unfinished task becomes the "current" pointer
                        expect(result.currentTask).toBe(task)
                        // no user row -> the attempts find must NOT run
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                    })

                it("marks a submitted-but-failing task incomplete and current",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask(),
                        ])
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-1",
                        })
                        // latest score 40 < 100 x 0.5 -> failing
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt({
                                score: 40,
                            }),
                        ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.completed).toBe(false)
                        expect(task.lastScore).toBe(40)
                        expect(task.numAttempts).toBe(1)
                        expect(result.currentTask).toBe(task)
                    })

                it("uses the first (highest-numbered) attempt as the latest score",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask(),
                        ])
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-1",
                        })
                        // the query orders attemptNumber DESC, so index 0 is the latest
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt({
                                attemptNumber: 3,
                                score: 95,
                            }),
                            buildAttempt({
                                attemptNumber: 2,
                                score: 10,
                            }),
                        ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.lastScore).toBe(95)
                        expect(task.completed).toBe(true)
                        expect(task.numAttempts).toBe(2)
                    })

                it("treats a null latest-attempt score as zero",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask(),
                        ])
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-1",
                        })
                        // attempt graded with no score -> treated as 0, failing the threshold
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt({
                                score: null,
                            }),
                        ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.lastScore).toBe(0)
                        expect(task.completed).toBe(false)
                    })

                it("points currentTask at the first unfinished task across many tasks",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // three tasks: first passes, second fails, third never started
                        entityManager.find.mockResolvedValueOnce([
                            buildMilestoneTask({
                                id: "task-1",
                            }),
                            buildMilestoneTask({
                                id: "task-2",
                            }),
                            buildMilestoneTask({
                                id: "task-3",
                            }),
                        ])
                        // task-1: user row + passing attempt
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-1",
                        })
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt({
                                score: 100,
                            }),
                        ])
                        // task-2: user row + failing attempt
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-task-2",
                        })
                        entityManager.find.mockResolvedValueOnce([
                            buildAttempt({
                                score: 10,
                            }),
                        ])
                        // task-3: never started
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const result = await service.getProgress(enrollment)

                        // all three tasks recorded in order
                        expect(result.completionTasks.map((task) => task.id)).toEqual([
                            "task-1",
                            "task-2",
                            "task-3",
                        ])
                        // first unfinished is task-2 (failing), NOT the later not-started one
                        expect(result.currentTask?.id).toBe("task-2")
                    })
            })
    })
