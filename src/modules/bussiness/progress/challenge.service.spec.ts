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
    ChallengeProgressStatus,
} from "@modules/integrations/cache/types/cache-results/challenge-submission-progress"
import type {
    ChallengeSubmissionProgressCacheResult,
} from "@modules/integrations/cache/types/cache-results/challenge-submission-progress"
import {
    UserChallengeProgressProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-progress-projection.entity"
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

/** Fraction of a submission's score the latest attempt must reach to pass. */
const PASS_THRESHOLD = 0.5

/**
 * Build a single submission row hanging off a challenge (the grading template
 * the user's attempts are scored against).
 */
const buildSubmission = (
    overrides: Partial<{ id: string; score: number }> = {
    },
): { id: string; score: number } => ({
    id: "sub-1",
    score: 100,
    ...overrides,
})

/** Build a challenge row with one submission and the `submissions` relation. */
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

/** Build a single attempt row for a user submission. */
const buildAttempt = (
    overrides: Partial<{ attemptNumber: number; score: number | null }> = {
    },
): { attemptNumber: number; score: number | null } => ({
    attemptNumber: 1,
    score: 100,
    ...overrides,
})

/** Build a user submission row, including its `submission` relation and `attempts`. */
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

/** A passed-challenge completion task (the canonical happy-path aggregate). */
const passedTask = {
    id: "challenge-1",
    lastScore: 100,
    maxScore: 100,
    completed: true,
    status: ChallengeProgressStatus.Completed,
    numAttempts: 1,
}

describe("ChallengeProgressService",
    () => {
        let module: TestingModule
        let service: ChallengeProgressService
        let entityManager: EntityManagerMock
        let mountStorageService: { appConfig: unknown }

        const enrollment: ProgressEnrollmentType = {
            courseId: "course-1",
            enrollmentId: "enrollment-1",
        }

        /** Parse the jsonb payload the last UPSERT (`recompute`) wrote. */
        const lastUpsertPayload = (): ChallengeSubmissionProgressCacheResult => {
            const calls = entityManager.query.mock.calls
            const [, params] = calls[calls.length - 1] as [string, Array<string>]
            return JSON.parse(params[1]) as ChallengeSubmissionProgressCacheResult
        }

        /** A projection row wrapper around a computed value with a given freshness. */
        const projectionRow = (
            value: ChallengeSubmissionProgressCacheResult,
            updatedAt: Date,
        ): Partial<UserChallengeProgressProjectionEntity> => ({
            enrollmentId: enrollment.enrollmentId,
            value: value as unknown as Record<string, unknown>,
            updatedAt,
        })

        beforeEach(async () => {
            // fresh entity manager with happy-path defaults (findOne -> null, find -> [])
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
                it("returns the stored projection value on a fresh-row hit and never recomputes",
                    async () => {
                        const stored: ChallengeSubmissionProgressCacheResult = {
                            completionTasks: [
                                passedTask,
                            ],
                        }
                        entityManager.findOne.mockResolvedValueOnce(
                            projectionRow(stored,
                                new Date()),
                        )

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual(stored)
                        // a fresh row short-circuits the DB compute + the UPSERT
                        expect(entityManager.find).not.toHaveBeenCalled()
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("recomputes + re-reads when the projection row is missing",
                    async () => {
                        const recomputed: ChallengeSubmissionProgressCacheResult = {
                            completionTasks: [
                                passedTask,
                            ],
                        }
                        // 1st read -> miss; 2nd read (after recompute) -> the fresh row
                        entityManager.findOne
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce(projectionRow(recomputed,
                                new Date()))
                        // compute reads: challenges then user submissions
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission(),
                            ])

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual(recomputed)
                        // the UPSERT ran with the freshly computed aggregate
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        expect(lastUpsertPayload().completionTasks).toEqual([
                            passedTask,
                        ])
                    })

                it("recomputes when the projection row is older than the TTL",
                    async () => {
                        const stale: ChallengeSubmissionProgressCacheResult = {
                            completionTasks: [],
                        }
                        const fresh: ChallengeSubmissionProgressCacheResult = {
                            completionTasks: [
                                passedTask,
                            ],
                        }
                        // a row written an hour ago is past the (5m) freshness window
                        entityManager.findOne
                            .mockResolvedValueOnce(
                                projectionRow(stale,
                                    new Date(Date.now() - 60 * 60 * 1000)),
                            )
                            .mockResolvedValueOnce(projectionRow(fresh,
                                new Date()))
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission(),
                            ])

                        const result = await service.getProgress(enrollment)

                        expect(result).toEqual(fresh)
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })
            })

        describe("recompute",
            () => {
                it("computes from DB and UPSERTs the aggregate keyed by enrollment",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission(),
                            ])

                        await service.recompute(enrollment)

                        // recompute never reads the projection row -- it always rebuilds
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        const [sql,
                            params] = entityManager.query.mock.calls[0] as [string, Array<string>]
                        expect(sql).toContain("user_challenge_progress_projections")
                        expect(params[0]).toBe(enrollment.enrollmentId)
                        expect(lastUpsertPayload().completionTasks).toEqual([
                            passedTask,
                        ])
                    })

                it("short-circuits to an empty list when the course has no challenges",
                    async () => {
                        // no challenges -> the second find (user submissions) must NOT run
                        entityManager.find.mockResolvedValueOnce([])

                        await service.recompute(enrollment)

                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                        expect(lastUpsertPayload()).toEqual({
                            completionTasks: [],
                        })
                    })

                it("reports NotStarted when no user submission row exists",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([])

                        await service.recompute(enrollment)

                        const task = lastUpsertPayload().completionTasks[0]
                        expect(task.status).toBe(ChallengeProgressStatus.NotStarted)
                        expect(task.completed).toBe(false)
                        expect(task.numAttempts).toBe(0)
                        expect(task.lastScore).toBe(0)
                    })

                it("reports InProgress when a submission exists but has no attempt yet",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [],
                                }),
                            ])

                        await service.recompute(enrollment)

                        expect(lastUpsertPayload().completionTasks[0].status).toBe(
                            ChallengeProgressStatus.InProgress,
                        )
                    })

                it("reports Failed when the latest attempt is below the pass threshold",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            // 40 < 100 x 0.5 -> submitted but failed
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [
                                        buildAttempt({
                                            score: 40,
                                        }),
                                    ],
                                }),
                            ])

                        await service.recompute(enrollment)

                        const task = lastUpsertPayload().completionTasks[0]
                        expect(task.status).toBe(ChallengeProgressStatus.Failed)
                        expect(task.completed).toBe(false)
                        expect(task.lastScore).toBe(40)
                    })

                it("picks the highest-numbered attempt as the latest and caps the score",
                    async () => {
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

                        await service.recompute(enrollment)

                        const task = lastUpsertPayload().completionTasks[0]
                        // latest score 90 capped at the submission's own max of 80
                        expect(task.lastScore).toBe(80)
                        expect(task.numAttempts).toBe(2)
                        expect(task.status).toBe(ChallengeProgressStatus.Completed)
                    })

                it("treats a null attempt score as zero (failing the threshold)",
                    async () => {
                        entityManager.find
                            .mockResolvedValueOnce([
                                buildChallenge(),
                            ])
                            .mockResolvedValueOnce([
                                buildUserSubmission({
                                    attempts: [
                                        buildAttempt({
                                            score: null,
                                        }),
                                    ],
                                }),
                            ])

                        await service.recompute(enrollment)

                        const task = lastUpsertPayload().completionTasks[0]
                        expect(task.lastScore).toBe(0)
                        expect(task.status).toBe(ChallengeProgressStatus.Failed)
                    })
            })

        describe("invalidateProgress",
            () => {
                it("deletes the projection row for the enrollment",
                    async () => {
                        await service.invalidateProgress(enrollment.enrollmentId)

                        expect(entityManager.delete).toHaveBeenCalledWith(
                            UserChallengeProgressProjectionEntity,
                            {
                                enrollmentId: enrollment.enrollmentId,
                            },
                        )
                    })
            })
    })
