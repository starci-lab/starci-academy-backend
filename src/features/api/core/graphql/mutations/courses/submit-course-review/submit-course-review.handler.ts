import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    SubmitCourseReviewCommand,
} from "./submit-course-review.command"

/** The lowest star a review may carry. */
const MINIMUM_SCORE = 1

/** The highest star a review may carry. */
const MAXIMUM_SCORE = 5

@CommandHandler(SubmitCourseReviewCommand)
@Injectable()
/**
 * Handler for the submitCourseReview mutation.
 *
 * Writes one review row after four gates: the caller is somebody, the score is a whole star on the
 * scale, the course exists, and the caller holds a PAID enrollment on it.
 *
 * It deliberately does not look for an existing review. A learner may review the same course more
 * than once, so a second row is the feature rather than a duplicate to swallow -- the check that
 * would look idempotent here is the one that would silently discard the opinion somebody just
 * formed at module ten.
 */
export class SubmitCourseReviewHandler
    extends ICQRSHandler<SubmitCourseReviewCommand, CourseReviewEntity>
    implements ICommandHandler<SubmitCourseReviewCommand, CourseReviewEntity> {
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Processes the submitCourseReview command.
     * @param command - The command carrying request + authenticated user.
     * @returns The review row that was written.
     */
    protected override async process(
        command: SubmitCourseReviewCommand,
    ): Promise<CourseReviewEntity> {
        const {
            request,
            user,
        } = command.params

        // the handler owns its own preconditions: the resolver's guard covers ONE door, and this
        // command is reachable from the CLI, a job and the harness as well
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            body,
            courseId,
            score,
        } = request

        // cheapest gate first -- a malformed score needs no database to refuse, and refusing it
        // before two queries keeps a bad request from costing what a good one costs
        if (!Number.isInteger(score) || score < MINIMUM_SCORE || score > MAXIMUM_SCORE) {
            throw new CourseReviewScoreOutOfRangeException({
                maximum: MAXIMUM_SCORE,
                minimum: MINIMUM_SCORE,
                score,
            })
        }

        const courseExists = await this.entityManager.exists(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
            },
        )
        if (!courseExists) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }

        // `isEnrolled: true` is the field that separates a purchase from a trial row. Dropping it
        // would let a preview reviewer rate a course they never bought, and the row's existence
        // alone cannot tell the two apart
        const hasPaidEnrollment = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    isEnrolled: true,
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!hasPaidEnrollment) {
            throw new CourseReviewRequiresEnrollmentException({
                courseId,
                userId: user.id,
            })
        }

        const review = this.entityManager.create(
            CourseReviewEntity,
            {
                // an absent body is stored as null rather than as an empty string, so a reader
                // filtering for "reviews with something written" has one value to test
                body: body ?? null,
                course: {
                    id: courseId,
                },
                courseId,
                score,
                user: {
                    id: user.id,
                },
                userId: user.id,
            },
        )

        return this.entityManager.save(review)
    }
}
