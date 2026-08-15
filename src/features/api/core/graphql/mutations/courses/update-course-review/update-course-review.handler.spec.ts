// Load the bussiness barrel first so its CQRS base classes are initialised before the handler
// pulls `@modules/cqrs` -- dodges a load-order "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CourseReviewNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-review-not-found"
import {
    CourseReviewNotOwnedException,
} from "@modules/platform/exceptions/errors/courses/course-review-not-owned"
import {
    CourseReviewScoreOutOfRangeException,
} from "@modules/platform/exceptions/errors/courses/course-review-score-out-of-range"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UpdateCourseReviewCommand,
} from "./update-course-review.command"
import {
    UpdateCourseReviewHandler,
} from "./update-course-review.handler"

/** The primary connection's name, declared here as the sibling specs declare it. */
const POSTGRESQL_PRIMARY = "primary"

/** The learner who wrote the review under test. */
const AUTHOR_ID = "11111111-1111-1111-1111-111111111111"

/** Somebody else, reaching for a review that is not theirs. */
const STRANGER_ID = "33333333-3333-3333-3333-333333333333"

/** The review being edited. */
const REVIEW_ID = "44444444-4444-4444-4444-444444444444"

interface StoredCourseReviewOverrides {
    body?: string | null
    score?: number
    userId?: string
}

interface UpdateCourseReviewCommandOverrides {
    body?: string | null
    reviewId?: string
    score?: number
    // null rather than undefined, because a destructuring default fires on `undefined` and the
    // identity case would then hand the handler a real user while staying green
    user?: UserEntity | null
}

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/**
 * Build the stored review the handler will load.
 *
 * @param overrides - Fields to vary per case.
 * @returns A review row owned by the author unless told otherwise.
 */
const storedReview = ({
    body = "as written",
    score = 3,
    userId = AUTHOR_ID,
}: StoredCourseReviewOverrides = {
}): CourseReviewEntity => ({
    body,
    courseId: "22222222-2222-2222-2222-222222222222",
    id: REVIEW_ID,
    score,
    userId,
}) as unknown as CourseReviewEntity

/**
 * Build the command the handler receives.
 *
 * @param overrides - Request fields to vary per case, and the acting user.
 * @returns A command carrying request, user and locale.
 */
const command = ({
    body,
    reviewId = REVIEW_ID,
    score,
    user = fakeUser(AUTHOR_ID),
}: UpdateCourseReviewCommandOverrides): UpdateCourseReviewCommand =>
    new UpdateCourseReviewCommand({
        locale: Locale.En,
        request: {
            body,
            reviewId,
            score,
        },
        user: user as UserEntity,
    })

describe("UpdateCourseReviewHandler",
    () => {
        let module: TestingModule
        let handler: UpdateCourseReviewHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.findOne = jest.fn().mockResolvedValue(storedReview())
            entityManager.save = jest.fn(async (row) => row)

            module = await Test.createTestingModule({
                providers: [
                    UpdateCourseReviewHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get(UpdateCourseReviewHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses a caller with no identity",
            async () => {
                await expect(handler.execute(command({
                    user: null,
                }))).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("refuses a review that does not exist",
            async () => {
                entityManager.findOne = jest.fn().mockResolvedValue(null)

                await expect(handler.execute(command({
                    score: 4,
                }))).rejects.toBeInstanceOf(CourseReviewNotFoundException)
            })

        it("refuses a caller who did not write the review",
            async () => {
                await expect(handler.execute(command({
                    score: 4,
                    user: fakeUser(STRANGER_ID),
                }))).rejects.toBeInstanceOf(CourseReviewNotOwnedException)
            })

        it("decides ownership from the LOADED row, not from the request",
            async () => {
            // the stored row says the author owns it; the stranger asks anyway. Nothing the caller
            // sent is consulted, which is the point -- an id the caller supplied is an id they can
            // change, and a check written against one is a check they pass by choosing another
                entityManager.findOne = jest.fn().mockResolvedValue(storedReview({
                    userId: AUTHOR_ID,
                }))

                await expect(handler.execute(command({
                    user: fakeUser(STRANGER_ID),
                }))).rejects.toBeInstanceOf(CourseReviewNotOwnedException)
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it.each([
            ["below the scale",
                0],
            ["above the scale",
                6],
            ["not a whole star",
                2.5],
        ])("refuses a score %s",
            async (_name, score) => {
                await expect(handler.execute(command({
                    score,
                }))).rejects.toBeInstanceOf(CourseReviewScoreOutOfRangeException)
            })

        it("refuses a malformed score before it costs a round trip",
            async () => {
                await expect(handler.execute(command({
                    score: 99,
                }))).rejects.toBeInstanceOf(CourseReviewScoreOutOfRangeException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it.each([
            ["the lower boundary",
                1],
            ["the upper boundary",
                5],
        ])("accepts a score at %s",
            async (_name, score) => {
                const review = await handler.execute(command({
                    score,
                }))

                expect(review.score).toBe(score)
            })

        it("keeps the current score when the score is omitted",
            async () => {
                const review = await handler.execute(command({
                    body: "edited",
                }))

                expect(review.score).toBe(3)
            })

        it("keeps the current body when the body is omitted",
            async () => {
                const review = await handler.execute(command({
                    score: 5,
                }))

                expect(review.body).toBe("as written")
            })

        it("replaces the body when one is given",
            async () => {
                const review = await handler.execute(command({
                    body: "on reflection, the caching module carried it",
                }))

                expect(review.body).toBe("on reflection, the caching module carried it")
            })

        it("clears the body on an explicit null, which is not the same as omitting it",
            async () => {
            // the three outcomes the request shape exists to keep apart: absent keeps, present
            // replaces, explicit null clears. Collapse null into absent and "remove what I wrote"
            // becomes unsayable
                const review = await handler.execute(command({
                    body: null,
                }))

                expect(review.body).toBeNull()
            })

        it("changes nothing when neither field is given, and still answers with the row",
            async () => {
                const review = await handler.execute(command({
                }))

                expect(review.score).toBe(3)
                expect(review.body).toBe("as written")
            })
    })
