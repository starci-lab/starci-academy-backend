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
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    CourseReviewRequiresEnrollmentException,
} from "@modules/platform/exceptions/errors/courses/course-review-requires-enrollment"
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SubmitCourseReviewCommand,
} from "./submit-course-review.command"
import {
    SubmitCourseReviewHandler,
} from "./submit-course-review.handler"

/**
 * The primary connection's name, declared here as the sibling specs declare it.
 *
 * The token is a plain string in the datasource registration, so a spec that imported it would
 * drag the module graph in to read one literal.
 */
const POSTGRESQL_PRIMARY = "primary"

/** The learner acting in every case that gets past the identity gate. */
const USER_ID = "11111111-1111-1111-1111-111111111111"

/** The course being reviewed. */
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
 * Build the command the handler receives.
 *
 * @param overrides - Request fields to vary per case, and the acting user.
 * @returns A command carrying request, user and locale.
 */
const command = ({
    body,
    courseId = COURSE_ID,
    score = 5,
    user = fakeUser(USER_ID),
}: {
    body?: string
    courseId?: string
    score?: number
    // null rather than undefined on purpose: a destructuring default fires on `undefined`, so
    // passing that would silently hand the handler a real user and the identity case would prove
    // nothing while staying green
    user?: UserEntity | null
}): SubmitCourseReviewCommand =>
    new SubmitCourseReviewCommand({
        locale: Locale.En,
        request: {
            body,
            courseId,
            score,
        },
        user: user as UserEntity,
    })

describe("SubmitCourseReviewHandler",
    () => {
        let module: TestingModule
        let handler: SubmitCourseReviewHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            // `exists` answers two different questions in this handler -- the course lookup and the
            // paid-enrollment lookup -- so each case programs it per call rather than once
            entityManager.exists = jest.fn().mockResolvedValue(true)
            entityManager.create = jest.fn((_entity, fields) => fields)
            entityManager.save = jest.fn(async (row) => ({
                id: "review-id",
                ...row,
            }))

            module = await Test.createTestingModule({
                providers: [
                    SubmitCourseReviewHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get(SubmitCourseReviewHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses a caller with no identity", async () => {
            await expect(handler.execute(command({
                user: null,
            }))).rejects.toBeInstanceOf(UserNotFoundException)
        })

        it("refuses a course that does not exist", async () => {
            // first `exists` call is the course lookup
            entityManager.exists = jest.fn().mockResolvedValueOnce(false)

            await expect(handler.execute(command({
            }))).rejects.toBeInstanceOf(CourseNotFoundException)
        })

        it("refuses a learner with no enrollment at all", async () => {
            entityManager.exists = jest.fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)

            await expect(handler.execute(command({
            }))).rejects.toBeInstanceOf(CourseReviewRequiresEnrollmentException)
        })

        it("refuses a TRIAL enrollment, because a row is not an entitlement", async () => {
            // the gate asks for `isEnrolled: true`, so a trial row simply does not match and the
            // second `exists` answers false. This is the case that would pass if the field were
            // dropped from the query, and nothing else in the suite would notice.
            entityManager.exists = jest.fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)

            await expect(handler.execute(command({
            }))).rejects.toBeInstanceOf(CourseReviewRequiresEnrollmentException)

            const enrollmentQuery = entityManager.exists.mock.calls[1][1]
            expect(enrollmentQuery.where.isEnrolled).toBe(true)
        })

        it.each([
            ["below the scale", 0],
            ["above the scale", 6],
            ["far below", -3],
            ["not a whole star", 4.5],
        ])("refuses a score %s", async (_name, score) => {
            await expect(handler.execute(command({
                score,
            }))).rejects.toBeInstanceOf(CourseReviewScoreOutOfRangeException)
        })

        it.each([
            ["the lower boundary", 1],
            ["the upper boundary", 5],
            ["the middle", 3],
        ])("accepts a score at %s", async (_name, score) => {
            const review = await handler.execute(command({
                score,
            }))

            expect(review.score).toBe(score)
        })

        it("refuses a malformed score before it costs a database round trip", async () => {
            await expect(handler.execute(command({
                score: 9,
            }))).rejects.toBeInstanceOf(CourseReviewScoreOutOfRangeException)

            expect(entityManager.exists).not.toHaveBeenCalled()
        })

        it("stores an absent body as null rather than as an empty string", async () => {
            const review = await handler.execute(command({
            }))

            expect(review.body).toBeNull()
        })

        it("stores the body the learner wrote", async () => {
            const review = await handler.execute(command({
                body: "The module on caching earned the price on its own.",
            }))

            expect(review.body).toBe("The module on caching earned the price on its own.")
        })

        it("writes the review against the caller and the course", async () => {
            const review = await handler.execute(command({
            }))

            expect(review.userId).toBe(USER_ID)
            expect(review.courseId).toBe(COURSE_ID)
        })

        it("accepts a SECOND review of the same course by the same learner", async () => {
            // the feature, not a duplicate: an opinion formed at module two is a different
            // statement from one formed at module ten, and a handler that swallowed the second
            // would discard the one the learner just took the trouble to write
            const first = await handler.execute(command({
                score: 3,
            }))
            const second = await handler.execute(command({
                score: 5,
            }))

            expect(first.score).toBe(3)
            expect(second.score).toBe(5)
            expect(entityManager.save).toHaveBeenCalledTimes(2)
        })
    })
