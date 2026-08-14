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
    DeleteCourseReviewCommand,
} from "./delete-course-review.command"
import {
    DeleteCourseReviewHandler,
} from "./delete-course-review.handler"

/** The primary connection's name, declared here as the sibling specs declare it. */
const POSTGRESQL_PRIMARY = "primary"

/** The learner who wrote the review under test. */
const AUTHOR_ID = "11111111-1111-1111-1111-111111111111"

/** Somebody else, reaching for a review that is not theirs. */
const STRANGER_ID = "33333333-3333-3333-3333-333333333333"

/** The review being deleted. */
const REVIEW_ID = "44444444-4444-4444-4444-444444444444"

/** The course it belongs to. */
const COURSE_ID = "22222222-2222-2222-2222-222222222222"

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
 * @param userId - Who owns it; the author unless told otherwise.
 * @returns A review row.
 */
const storedReview = (
    userId: string = AUTHOR_ID,
): CourseReviewEntity => ({
    body: "as written",
    courseId: COURSE_ID,
    id: REVIEW_ID,
    score: 4,
    userId,
}) as unknown as CourseReviewEntity

/**
 * Build the command the handler receives.
 *
 * @param overrides - The review being deleted and the acting user.
 * @returns A command carrying request, user and locale.
 */
const command = ({
    reviewId = REVIEW_ID,
    user = fakeUser(AUTHOR_ID),
}: {
    reviewId?: string
    // null rather than undefined, because a destructuring default fires on `undefined`
    user?: UserEntity | null
}): DeleteCourseReviewCommand =>
    new DeleteCourseReviewCommand({
        locale: Locale.En,
        request: {
            reviewId,
        },
        user: user as UserEntity,
    })

describe("DeleteCourseReviewHandler",
    () => {
        let module: TestingModule
        let handler: DeleteCourseReviewHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.findOne = jest.fn().mockResolvedValue(storedReview())
            entityManager.remove = jest.fn().mockResolvedValue(undefined)

            module = await Test.createTestingModule({
                providers: [
                    DeleteCourseReviewHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get(DeleteCourseReviewHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses a caller with no identity", async () => {
            await expect(handler.execute(command({
                user: null,
            }))).rejects.toBeInstanceOf(UserNotFoundException)
        })

        it("refuses a review that does not exist", async () => {
            entityManager.findOne = jest.fn().mockResolvedValue(null)

            await expect(handler.execute(command({
            }))).rejects.toBeInstanceOf(CourseReviewNotFoundException)
        })

        it("refuses a caller who did not write the review", async () => {
            await expect(handler.execute(command({
                user: fakeUser(STRANGER_ID),
            }))).rejects.toBeInstanceOf(CourseReviewNotOwnedException)
        })

        it("removes nothing when the caller is refused", async () => {
            // the assertion that matters more than the exception: a refusal that still deleted the
            // row would pass a test asserting only the throw
            await expect(handler.execute(command({
                user: fakeUser(STRANGER_ID),
            }))).rejects.toBeInstanceOf(CourseReviewNotOwnedException)

            expect(entityManager.remove).not.toHaveBeenCalled()
        })

        it("removes the review its author asked to remove", async () => {
            await handler.execute(command({
            }))

            expect(entityManager.remove).toHaveBeenCalledTimes(1)
        })

        it("answers with the review id and the course whose aggregate this invalidates", async () => {
            // the course id is read off the row BEFORE the delete -- afterwards there is nothing
            // left to ask, and a caller would hold a deletion it cannot attribute to a course
            const outcome = await handler.execute(command({
            }))

            expect(outcome.reviewId).toBe(REVIEW_ID)
            expect(outcome.courseId).toBe(COURSE_ID)
        })
    })
