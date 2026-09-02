import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    FlashcardDueReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-due-review-session.entity"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    UserService,
} from "../user/user.service"
import {
    EffectiveLearnerAccessService,
} from "../pro-subscription/effective-learner-access.service"
import {
    FlashcardDueReviewSessionService,
} from "./flashcard-due-review-session.service"

/** The caller in every test. */
const USER_ID = "user-1"
/** The course the due-review batch is drawn over. */
const COURSE_ID = "course-1"
/** The enrollment `resolveOrCreateTrialEnrollment` resolves to. */
const ENROLLMENT = {
    id: "enrollment-1",
}

describe("FlashcardDueReviewSessionService",
    () => {
        let testingModule: TestingModule
        let service: FlashcardDueReviewSessionService
        let entityManager: EntityManagerMock
        let userService: {
            resolveOrCreateTrialEnrollment: jest.Mock
            checkEnrollment: jest.Mock
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn()
                    .mockResolvedValue(ENROLLMENT),
                checkEnrollment: jest.fn()
                    .mockResolvedValue(true),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    FlashcardDueReviewSessionService,
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: asEntityManager(entityManager),
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: EffectiveLearnerAccessService,
                        useValue: {
                            hasCourseAccess: userService.checkEnrollment,
                        },
                    },
                ],
            }).compile()

            service = testingModule.get(FlashcardDueReviewSessionService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("start",
            () => {
                it("retires the prior in-flight draw before persisting the new one",
                    async () => {
                        entityManager.save.mockResolvedValue({
                            id: "session-new",
                        })

                        const result = await service.start({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                            cardIds: [
                                "card-a",
                                "card-b",
                            ],
                        })

                        expect(result).toEqual({
                            sessionId: "session-new",
                        })
                        expect(userService.resolveOrCreateTrialEnrollment)
                            .toHaveBeenCalledWith(USER_ID,
                                COURSE_ID)
                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            {
                                enrollment: {
                                    id: "enrollment-1",
                                },
                                status: "in_progress",
                            },
                            {
                                status: "abandoned",
                            },
                        )
                        // the retire must be issued before the insert, or a resume
                        // lookup could see two candidates
                        expect(entityManager.update.mock.invocationCallOrder[0])
                            .toBeLessThan(entityManager.save.mock.invocationCallOrder[0])
                    })

                it("persists the draw at index zero with empty progress",
                    async () => {
                        entityManager.save.mockResolvedValue({
                            id: "session-new",
                        })

                        await service.start({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                            cardIds: [
                                "card-a",
                            ],
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            {
                                enrollment: ENROLLMENT,
                                cardIds: [
                                    "card-a",
                                ],
                                currentIndex: 0,
                                reviewedCount: 0,
                                gradedIndexes: [],
                                xpEarned: 0,
                                status: "in_progress",
                            },
                        )
                    })

                it("keeps only accessible cards for a trial due-review draw",
                    async () => {
                        entityManager.save.mockResolvedValue({
                            id: "session-new",
                        })
                        userService.checkEnrollment.mockResolvedValueOnce(false)
                        entityManager.find.mockResolvedValueOnce([{
                            id: "card-free",
                        }])

                        await service.start({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                            cardIds: [
                                "card-free",
                                "card-premium",
                            ],
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            expect.objectContaining({
                                cardIds: [
                                    "card-free",
                                ],
                            }),
                        )
                    })
            })

        describe("sync",
            () => {
                it("writes the reported position for an owned in-flight session",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            status: "in_progress",
                        })

                        const result = await service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 3,
                            reviewedCount: 2,
                            gradedIndexes: [
                                0,
                                1,
                            ],
                            xpEarned: 15,
                        })

                        expect(result).toEqual({
                            success: true,
                        })
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            expect.objectContaining({
                                where: {
                                    id: "session-1",
                                    enrollment: {
                                        user: {
                                            id: USER_ID,
                                        },
                                    },
                                },
                            }),
                        )
                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            {
                                id: "session-1",
                            },
                            {
                                currentIndex: 3,
                                reviewedCount: 2,
                                gradedIndexes: [
                                    0,
                                    1,
                                ],
                                xpEarned: 15,
                            },
                        )
                    })

                it("leaves the graded-index set untouched when the caller omits it",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            status: "in_progress",
                        })

                        await service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            {
                                id: "session-1",
                            },
                            {
                                currentIndex: 1,
                                reviewedCount: 1,
                                xpEarned: 0,
                            },
                        )
                    })

                it("no-ops for a session that is not found or not owned",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        const result = await service.sync({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        expect(result).toEqual({
                            success: false,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("no-ops for a session that is no longer in progress",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            status: "completed",
                        })

                        const result = await service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        expect(result).toEqual({
                            success: false,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })
            })

        describe("complete",
            () => {
                it("flips an owned row to completed with the reported snapshot",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: "session-1",
                            reviewedCount: 12,
                            xpEarned: 40,
                        })

                        expect(result).toEqual({
                            reviewedCount: 12,
                            xpEarned: 40,
                        })
                        const [
                            entity,
                            where,
                            patch,
                        ] = entityManager.update.mock.calls[0]
                        expect(entity).toBe(FlashcardDueReviewSessionEntity)
                        expect(where.id).toBe("session-1")
                        // replay-safe: an already-completed row is refused, an
                        // abandoned one still accepts the learner's completion
                        expect(where.status).toBeDefined()
                        expect(patch).toEqual({
                            status: "completed",
                            reviewedCount: 12,
                            xpEarned: 40,
                        })
                    })

                it("echoes the snapshot without writing when the row is not owned",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                            reviewedCount: 5,
                            xpEarned: 10,
                        })

                        expect(result).toEqual({
                            reviewedCount: 5,
                            xpEarned: 10,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })
            })

        describe("findInProgress",
            () => {
                it("returns the resumable session for the caller's enrollment",
                    async () => {
                        const updatedAt = new Date("2026-08-19T10:00:00.000Z")
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            cardIds: [
                                "card-a",
                            ],
                            currentIndex: 2,
                            reviewedCount: 2,
                            gradedIndexes: [
                                0,
                                1,
                            ],
                            xpEarned: 20,
                            updatedAt,
                        })

                        const found = await service.findInProgress({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                        })

                        expect(found).toEqual({
                            sessionId: "session-1",
                            cardIds: [
                                "card-a",
                            ],
                            currentIndex: 2,
                            reviewedCount: 2,
                            gradedIndexes: [
                                0,
                                1,
                            ],
                            xpEarned: 20,
                            updatedAt,
                        })
                        const [
                            ,
                            options,
                        ] = entityManager.findOne.mock.calls[0]
                        expect(options.where.enrollment).toEqual({
                            id: "enrollment-1",
                        })
                        expect(options.where.status).toBe("in_progress")
                        // only sessions synced inside the resume window qualify
                        expect(options.where.updatedAt).toBeDefined()
                        expect(options.order).toEqual({
                            updatedAt: "DESC",
                        })
                    })

                it("defaults a null graded-index column to an empty list",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            cardIds: [],
                            currentIndex: 0,
                            reviewedCount: 0,
                            gradedIndexes: null,
                            xpEarned: 0,
                            updatedAt: new Date(),
                        })

                        const found = await service.findInProgress({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                        })

                        expect(found?.gradedIndexes).toEqual([])
                    })

                it("returns null when the enrollment has nothing resumable",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        await expect(service.findInProgress({
                            userId: USER_ID,
                            courseId: COURSE_ID,
                        })).resolves.toBeNull()
                    })
            })

        describe("findById",
            () => {
                it("resolves a session by id without a status or window filter",
                    async () => {
                        const updatedAt = new Date("2026-08-19T10:00:00.000Z")
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            cardIds: [
                                "card-a",
                                "card-b",
                            ],
                            currentIndex: 2,
                            reviewedCount: 2,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 5,
                            updatedAt,
                        })

                        const found = await service.findById({
                            userId: USER_ID,
                            sessionId: "session-1",
                        })

                        expect(found).toEqual({
                            sessionId: "session-1",
                            cardIds: [
                                "card-a",
                                "card-b",
                            ],
                            currentIndex: 2,
                            reviewedCount: 2,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 5,
                            updatedAt,
                        })
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            FlashcardDueReviewSessionEntity,
                            {
                                where: {
                                    id: "session-1",
                                    enrollment: {
                                        user: {
                                            id: USER_ID,
                                        },
                                    },
                                },
                            },
                        )
                    })

                it("defaults a null graded-index column to an empty list",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "session-1",
                            cardIds: [],
                            currentIndex: 0,
                            reviewedCount: 0,
                            gradedIndexes: null,
                            xpEarned: 0,
                            updatedAt: new Date(),
                        })

                        const found = await service.findById({
                            userId: USER_ID,
                            sessionId: "session-1",
                        })

                        expect(found?.gradedIndexes).toEqual([])
                    })

                it("returns null for a session the caller does not own",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        await expect(service.findById({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                        })).resolves.toBeNull()
                    })
            })
    })
