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
    DeleteCourseReviewCommand,
} from "./delete-course-review.command"
import {
    DeleteCourseReviewResponseData,
} from "./graphql-types/response"

@CommandHandler(DeleteCourseReviewCommand)
@Injectable()
/**
 * Handler for the deleteCourseReview mutation.
 *
 * Removes a review the caller wrote, and answers with the ids a client needs afterwards: the review
 * to drop from its list, and the course whose aggregate the removal invalidates.
 *
 * The course id is read off the row BEFORE the delete for a reason a later reader would otherwise
 * have to rediscover: after the row is gone there is nothing left to ask, and the caller would be
 * left holding a deletion it cannot attribute to a course.
 */
export class DeleteCourseReviewHandler
    extends ICQRSHandler<DeleteCourseReviewCommand, DeleteCourseReviewResponseData>
    implements ICommandHandler<DeleteCourseReviewCommand, DeleteCourseReviewResponseData> {
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
     * Processes the deleteCourseReview command.
     * @param command - The command carrying request + authenticated user.
     * @returns The removed review's id and the course it belonged to.
     */
    protected override async process(
        command: DeleteCourseReviewCommand,
    ): Promise<DeleteCourseReviewResponseData> {
        const {
            request,
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            reviewId,
        } = request

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

        // decided against the loaded row, never against an id the caller supplied
        if (review.userId !== user.id) {
            throw new CourseReviewNotOwnedException({
                id: reviewId,
                userId: user.id,
            })
        }

        const {
            courseId,
        } = review

        await this.entityManager.remove(review)

        return {
            courseId,
            reviewId,
        }
    }
}
