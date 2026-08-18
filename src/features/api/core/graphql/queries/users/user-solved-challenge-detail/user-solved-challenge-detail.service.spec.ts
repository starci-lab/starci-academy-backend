import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    UserChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    UserSolvedChallengeDetailService,
} from "./user-solved-challenge-detail.service"

/** The profile owner whose submission is being read. */
const TARGET_USER_ID = "user-1"

/** The submission being opened. */
const SUBMISSION_ID = "submission-1"

/** Builds a graded attempt row. */
const attemptRow = (
    overrides: Record<string, unknown> = {
    },
) => ({
    attemptNumber: 1,
    score: 90,
    submissionUrl: "https://github/pr/1",
    shortFeedback: "solid",
    processedAt: new Date("2026-08-01T00:00:00.000Z"),
    feedbacks: [],
    ...overrides,
})

/**
 * The public-profile view of one passed challenge. Two things matter: the read is
 * scoped to the PROFILE OWNER rather than the caller (this is somebody else's
 * profile), and the reported score/passedAt come from the attempt that actually
 * passed -- the newest graded attempt with a score -- not simply the latest one.
 */
describe("UserSolvedChallengeDetailService",
    () => {
        let entityManager: EntityManagerMock
        let service: UserSolvedChallengeDetailService

        /** Runs the read for the standard request. */
        const execute = () => service.execute({
            userId: TARGET_USER_ID,
            submissionId: SUBMISSION_ID,
        })

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            service = new UserSolvedChallengeDetailService(entityManager as never)
        })

        it("scopes the read to the profile owner, not the caller",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/1",
                    attempts: [],
                })

                await execute()

                const calls = entityManager.findOne.mock.calls as unknown as Array<[
                    unknown,
                    { where: Record<string, unknown> },
                ]>
                expect(calls[0][0]).toBe(UserChallengeSubmissionEntity)
                expect(calls[0][1].where).toEqual({
                    id: SUBMISSION_ID,
                    user: {
                        id: TARGET_USER_ID,
                    },
                })
            })

        it("reports a submission that is not the profile owner's as not found",
            async () => {
                entityManager.findOne.mockResolvedValue(null)

                await expect(execute())
                    .rejects.toBeInstanceOf(UserChallengeSubmissionNotFoundException)
            })

        it("reports the passing attempt's score, timestamp and ordered feedback",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/3",
                    selectedLang: "go",
                    submission: {
                        title: "fallback title",
                        type: "git",
                        challenge: {
                            title: "Build a rate limiter",
                            difficulty: "hard",
                            content: {
                                module: {
                                    course: {
                                        title: "Backend Mastery",
                                    },
                                },
                            },
                        },
                    },
                    attempts: [
                        attemptRow({
                            attemptNumber: 1,
                            score: 40,
                            processedAt: new Date("2026-08-01T00:00:00.000Z"),
                        }),
                        attemptRow({
                            attemptNumber: 3,
                            score: 95,
                            processedAt: new Date("2026-08-03T00:00:00.000Z"),
                            feedbacks: [
                                {
                                    orderIndex: 2,
                                    message: "second",
                                    detail: "d2",
                                    severity: "info",
                                    location: "l2",
                                    suggestion: "s2",
                                },
                                {
                                    orderIndex: 1,
                                    message: "first",
                                    detail: "d1",
                                    severity: "warn",
                                    location: "l1",
                                    suggestion: "s1",
                                },
                            ],
                        }),
                        attemptRow({
                            attemptNumber: 2,
                            score: 0,
                            processedAt: new Date("2026-08-02T00:00:00.000Z"),
                        }),
                    ],
                })

                const result = await execute()

                expect(result).toEqual({
                    id: SUBMISSION_ID,
                    // the challenge's own title wins over the submission's
                    title: "Build a rate limiter",
                    submissionUrl: "https://github/pr/3",
                    submissionType: "git",
                    selectedLang: "go",
                    difficulty: "hard",
                    // the newest SCORED attempt, not the newest attempt
                    score: 95,
                    courseTitle: "Backend Mastery",
                    passedAt: new Date("2026-08-03T00:00:00.000Z"),
                    feedbacks: [
                        {
                            message: "first",
                            detail: "d1",
                            severity: "warn",
                            location: "l1",
                            suggestion: "s1",
                        },
                        {
                            message: "second",
                            detail: "d2",
                            severity: "info",
                            location: "l2",
                            suggestion: "s2",
                        },
                    ],
                    // the attempt history reads newest-first
                    attempts: [
                        expect.objectContaining({
                            attemptNumber: 3,
                        }),
                        expect.objectContaining({
                            attemptNumber: 2,
                        }),
                        expect.objectContaining({
                            attemptNumber: 1,
                        }),
                    ],
                })
            })

        it("reports no pass when every attempt scored zero or was never graded",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/1",
                    selectedLang: null,
                    submission: {
                        title: "fallback title",
                        type: "git",
                        challenge: null,
                    },
                    attempts: [
                        attemptRow({
                            attemptNumber: 1,
                            score: 0,
                        }),
                        attemptRow({
                            attemptNumber: 2,
                            score: null,
                        }),
                        attemptRow({
                            attemptNumber: 3,
                            score: 80,
                            // scored but never graded -> not a pass
                            processedAt: null,
                        }),
                    ],
                })

                const result = await execute()

                expect(result.score).toBeNull()
                expect(result.passedAt).toBeNull()
                expect(result.feedbacks).toEqual([])
                // with no challenge relation the submission's own title stands in
                expect(result.title).toBe("fallback title")
                expect(result.difficulty).toBeNull()
                expect(result.courseTitle).toBeNull()
                expect(result.selectedLang).toBeNull()
                expect(result.attempts).toHaveLength(3)
            })

        it("tolerates a submission whose attempt list was never loaded",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/1",
                    submission: undefined,
                })

                const result = await execute()

                expect(result.attempts).toEqual([])
                expect(result.feedbacks).toEqual([])
                expect(result.score).toBeNull()
                expect(result.passedAt).toBeNull()
                expect(result.title).toBeUndefined()
                expect(result.submissionType).toBeUndefined()
                expect(result.selectedLang).toBeNull()
            })

        it("reports no course when the challenge is not wired to one",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/1",
                    submission: {
                        title: "fallback",
                        type: "git",
                        challenge: {
                            title: "Orphan challenge",
                            difficulty: "easy",
                            content: null,
                        },
                    },
                    attempts: [attemptRow({
                        feedbacks: undefined,
                    })],
                })

                const result = await execute()

                expect(result.courseTitle).toBeNull()
                expect(result.title).toBe("Orphan challenge")
                // a passing attempt whose feedback was never loaded yields no rows
                expect(result.feedbacks).toEqual([])
                expect(result.score).toBe(90)
            })

        it("sorts an attempt with an absent grading timestamp last instead of crashing",
            async () => {
                entityManager.findOne.mockResolvedValue({
                    id: SUBMISSION_ID,
                    submissionUrl: "https://github/pr/1",
                    submission: {
                        title: "fallback",
                        type: "git",
                        challenge: null,
                    },
                    attempts: [
                        // `processedAt` absent rather than null slips past the
                        // "was it graded" filter, so the comparator's own guard is what
                        // keeps it from being ranked as the newest pass
                        attemptRow({
                            attemptNumber: 1,
                            score: 50,
                            processedAt: undefined,
                        }),
                        attemptRow({
                            attemptNumber: 2,
                            score: 70,
                            processedAt: new Date("2026-08-05T00:00:00.000Z"),
                        }),
                        // a second timestamp-less attempt, so the comparator meets an
                        // absent timestamp on BOTH sides of the subtraction
                        attemptRow({
                            attemptNumber: 3,
                            score: 60,
                            processedAt: undefined,
                        }),
                    ],
                })

                const result = await execute()

                expect(result.score).toBe(70)
                expect(result.passedAt).toEqual(new Date("2026-08-05T00:00:00.000Z"))
            })
    })
