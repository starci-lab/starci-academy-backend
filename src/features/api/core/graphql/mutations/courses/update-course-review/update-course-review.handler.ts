import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
    UpdateCourseReviewCommand,
} from "./update-course-review.command"

/** The lowest star a review may carry. */
const MINIMUM_SCORE = 1

/** The highest star a review may carry. */
const MAXIMUM_SCORE = 5

@CommandHandler(UpdateCourseReviewCommand)
@Injectable()
/**
 * Handler for the updateCourseReview mutation.
 *
 * Edits a review the caller wrote. The enrollment gate is NOT repeated here: the review's existence
 * is the proof that the gate was passed when it was written, and re-checking would take an author's
 * own words away from them the day a refund closes their enrollment.
 *
 * Ownership is decided against the LOADED row rather than against anything the request carried,
 * which is AUTHZ-3: an id the caller supplied is an id the caller can change.
 */
export class UpdateCourseReviewHandler
    extends ICQRSHandler<UpdateCourseReviewCommand, CourseReviewEntity>
    implements ICommandHandler<UpdateCourseReviewCommand, CourseReviewEntity> {
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
     * Processes the updateCourseReview command.
     * @param command - The command carrying request + authenticated user.
     * @returns The review row as it now stands.
     */
    protected override async process(
        command: UpdateCourseReviewCommand,
    ): Promise<CourseReviewEntity> {
        const {
            request,
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            body,
            reviewId,
            score,
        } = request

        // validate before loading, so a malformed edit costs no round trip
        if (
            score !== undefined
            && score !== null
            && (!Number.isInteger(score) || score < MINIMUM_SCORE || score > MAXIMUM_SCORE)
        ) {
            throw new CourseReviewScoreOutOfRangeException({
                maximum: MAXIMUM_SCORE,
                minimum: MINIMUM_SCORE,
                score,
            })
        }

        const review = await this.entityManager.findOne(
            CourseReviewEntity,
            {
                where: {
                    id: reviewId,
                },
            },
        )
        if (!review) {
            throw new CourseReviewNotFoundException({
                id: reviewId,
            })
        }

        // the row decides, and the row was loaded. A course's reviews are listed publicly, so
        // naming this refusal discloses nothing the caller could not already see -- AUTHZ-4's
        // not-found answer is for rows whose existence is itself the secret, and this is not one
        if (review.userId !== user.id) {
            throw new CourseReviewNotOwnedException({
                id: reviewId,
                userId: user.id,
            })
        }

        // absence keeps, presence replaces, and an explicit null on the body clears it -- the three
        // outcomes the request shape exists to keep separable
        if (score !== undefined && score !== null) {
            review.score = score
        }
        if (body !== undefined) {
            review.body = body
        }

        return this.entityManager.save(review)
    }
}
