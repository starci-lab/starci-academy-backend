import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChallengeProgressService,
} from "./challenge.service"
import {
    CacheKey,
    CacheService,
    ChallengeProgressStatus,
} from "@modules/cache"
import type {
    ChallengeSubmissionProgressCacheResult,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    ProgressEnrollmentType,
} from "./types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Fraction of a submission's score the latest attempt must reach to pass. */
const PASS_THRESHOLD = 0.5

/**
 * Build a single submission row hanging off a challenge (the grading template
 * the user's attempts are scored against).
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A submission-shaped object usable as a {@link ChallengeEntity} child.
 */
const buildSubmission = (
    overrides: Partial<{ id: string; score: number }> = {
    },
): { id: string; score: number } => ({
    id: "sub-1",
    score: 100,
    ...overrides,
})

/**
 * Build a challenge row with one submission and the relations the compute path
 * reads (`submissions`).
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A challenge-shaped object usable as a `find` return row.
 */
const buildChallenge = (
    overrides: Partial<{
        id: string
        score: number
        submissions: Array<{ id: string; score: number }>
    }> = {
    },
): {
    id: string
    score: number
    submissions: Array<{ id: string; score: number }>
} => ({
    id: "challenge-1",
    score: 100,
    submissions: [
        buildSubmission(),
    ],
    ...overrides,
})

/**
 * Build a single attempt row for a user submission.
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

/**
 * Build a user submission row (a user's work against one submission template),
 * including its `submission` relation and `attempts` list.
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A user-submission-shaped object usable as a `find` return row.
 */
const buildUserSubmission = (
    overrides: Partial<{
        submission: { id: string; challengeId: string }
        attempts: Array<{ attemptNumber: number; score: number | null }>
    }> = {
    },
): {
    submission: { id: string; challengeId: string }
    attempts: Array<{ attemptNumber: number; score: number | null }>
} => ({
    submission: {
        id: "sub-1",
        challengeId: "challenge-1",
    },
    attempts: [
        buildAttempt(),
    ],
    ...overrides,
})

describe("ChallengeProgressService",
    () => {
        let module: TestingModule
        let service: ChallengeProgressService
        let cacheService: jest.Mocked<CacheService>
        let entityManager: EntityManagerMock
        let mountStorageService: { appConfig: unknown }

        const enrollment: ProgressEnrollmentType = {
            courseId: "course-1",
            enrollmentId: "enrollment-1",
        }

        beforeEach(async () => {
            // cache stubs — programmed per-test for hit / miss behavior
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            // fresh entity manager with happy-path defaults (find → [])
            entityManager = makeEntityManagerMock()

            // mount config exposes the pass threshold as a plain getter property
            mountStorageService = {
                appConfig: {
                    systemConfig: {
                        challenge: {
                            passThreshold: PASS_THRESHOLD,
                        },
                    },
                },
            }

            module = await Test.createTestingModule({
                providers: [
                    ChallengeProgressService,
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

            service = module.get<ChallengeProgressService>(ChallengeProgressService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getProgress",
            () => {
                it("returns the cached payload on a hit and never touches the database",
                    async () => {
                        const cached: ChallengeSubmissionProgressCacheResult = {
                            completionTasks: [
                                {
                                    id: "challenge-1",
                                    lastScore: 100,
                                    maxScore: 100,
                                    completed: true,
                                    status: ChallengeProgressStatus.Completed,
                                    numAttempts: 1,
                                },
                            ],
                        }
                        cacheService.get.mockResolvedValueOnce(cached)

                        const result = await service.getProgress(enrollment)

                        expect(result).toBe(cached)
                        expect(cacheService.get).toHaveBeenCalledWith({
                            key: CacheKey.ChallengeSubmissionProgress,
                            args: [enrollment.enrollmentId],
                        })
                        // a hit short-circuits the DB compute and the re-cache write
                        expect(entityManager.find).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("recomputes when the cache returns a value missing completionTasks",
                    async () => {
                        // a malformed cache row (no completionTasks) must fall through to compute
                        cacheService.get.mockResolvedValueOnce({
                        } as unknown as ChallengeSubmissionProgressCacheResult)
                        // no challenges in the course → empty completion list
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual({
                            completionTasks: [],
                        })
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.ChallengeSubmissionProgress,
                            args: [enrollment.enrollmentId],
                            cacheResult: result,
                        })
                    })

                it("computes from DB on a miss and stores the result",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // first find → challenges, second find → user submissions
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission(),
                            ])

                        const result = await service.getProgress(enrollment)

                        // latest attempt (100) ≥ 100 × 0.5 → every submission passed
                        expect(result.completionTasks).toEqual([
                            {
                                id: "challenge-1",
                                lastScore: 100,
                                maxScore: 100,
                                completed: true,
                                status: ChallengeProgressStatus.Completed,
                                numAttempts: 1,
                            },
                        ])
                        expect(entityManager.find).toHaveBeenCalledTimes(2)
                        expect(cacheService.set).toHaveBeenCalled()
                    })
            })

        describe("updateProgress",
            () => {
                it("recomputes from DB and writes the result to cache",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission(),
                            ])

                        await service.updateProgress(enrollment)

                        // updateProgress never reads cache — it always recomputes
                        expect(cacheService.get).not.toHaveBeenCalled()
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.ChallengeSubmissionProgress,
                            args: [enrollment.enrollmentId],
                            cacheResult: {
                                completionTasks: [
                                    {
                                        id: "challenge-1",
                                        lastScore: 100,
                                        maxScore: 100,
                                        completed: true,
                                        status: ChallengeProgressStatus.Completed,
                                        numAttempts: 1,
                                    },
                                ],
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
                            key: CacheKey.ChallengeSubmissionProgress,
                            args: [enrollment.enrollmentId],
                        })
                    })
            })

        describe("computeProgress status derivation",
            () => {
                it("short-circuits to an empty list when the course has no challenges",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // no challenges → the second find (user submissions) must NOT run
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual({
                            completionTasks: [],
                        })
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                    })

                it("reports NotStarted when no user submission row exists",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            // user never created a submission
                            .mockResolvedValueOnce([])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.status).toBe(ChallengeProgressStatus.NotStarted)
                        expect(task.completed).toBe(false)
                        expect(task.numAttempts).toBe(0)
                        expect(task.lastScore).toBe(0)
                    })

                it("reports InProgress when a submission exists but has no attempt yet",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            // submission row created but never submitted for grading
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [],
                                }),
                            ])

                        const result = await service.getProgress(enrollment)

                        expect(result.completionTasks[0].status).toBe(
                            ChallengeProgressStatus.InProgress,
                        )
                    })

                it("reports Failed when the latest attempt is below the pass threshold",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            // 40 < 100 × 0.5 → submitted but failed
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [
                                        buildAttempt({
                                            score: 40,
                                        }),
                                    ],
                                }),
                            ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.status).toBe(ChallengeProgressStatus.Failed)
                        expect(task.completed).toBe(false)
                        // lastScore still accumulates the latest attempt's capped score
                        expect(task.lastScore).toBe(40)
                    })

                it("picks the highest-numbered attempt as the latest and caps the score",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge({
                                    submissions: [
                                        buildSubmission({
                                            score: 80,
                                        }),
                                    ],
                                }),
                            ])
                            // out-of-order attempts; attempt #2 (90) is the latest
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [
                                        buildAttempt({
                                            attemptNumber: 1,
                                            score: 10,
                                        }),
                                        buildAttempt({
                                            attemptNumber: 2,
                                            score: 90,
                                        }),
                                    ],
                                }),
                            ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        // latest score 90 capped at the submission's own max of 80
                        expect(task.lastScore).toBe(80)
                        expect(task.numAttempts).toBe(2)
                        expect(task.status).toBe(ChallengeProgressStatus.Completed)
                    })

                it("treats a null attempt score as zero (failing the threshold)",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            // attempt graded with no score → treated as 0
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [
                                        buildAttempt({
                                            score: null,
                                        }),
                                    ],
                                }),
                            ])

                        const result = await service.getProgress(enrollment)

                        const task = result.completionTasks[0]
                        expect(task.lastScore).toBe(0)
                        expect(task.status).toBe(ChallengeProgressStatus.Failed)
                    })
            })
    })
