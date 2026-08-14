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
    CourseReviewStatsProjectionService,
} from "@modules/bussiness/projections/course-review-stats/course-review-stats-projection.service"
import {
    clampPagination,
} from "@modules/lib/common/utils/pagination"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseReviewsQuery,
} from "./course-reviews.query"
import type {
    CourseReviewsPageObject,
} from "./graphql-types/course-reviews-page.object"

@QueryHandler(CourseReviewsQuery)
@Injectable()
/**
 * Handler for the courseReviews query.
 *
 * Reads one page of a course's reviews and the course's whole-population aggregate, and returns
 * them together. The page comes from the source table; the average does NOT -- it comes from the
 * projection, because a mean over every review is not a question a page of ten rows can answer,
 * and computing it per request would charge every viewer for an answer that only changes when
 * somebody writes a review.
 *
 * There is no identity gate: a course's reviews are what a buyer reads BEFORE buying, so requiring
 * a session would hide them from exactly the reader they exist for.
 */
export class CourseReviewsHandler
    extends ICQRSHandler<CourseReviewsQuery, CourseReviewsPageObject>
    implements IQueryHandler<CourseReviewsQuery, CourseReviewsPageObject> {
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     * @param courseReviewStatsProjectionService - Serves the course's rating aggregate.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseReviewStatsProjectionService: CourseReviewStatsProjectionService,
    ) {
        super()
    }

    /**
     * Processes the courseReviews query.
     * @param query - The message carrying the course id and the requested page.
     * @returns The page of reviews, the total, and the course's mean score.
     */
    protected override async process(
        query: CourseReviewsQuery,
    ): Promise<CourseReviewsPageObject> {
        const {
            request,
        } = query.params

        const {
            courseId,
            limit,
            offset,
        } = request

        // one clamp, in the one place that knows what a page of reviews costs -- an unclamped
        // limit is a caller-controlled table scan
        const {
            limit: take,
            offset: skip,
        } = clampPagination(limit,
            offset)

        const [
            nodes,
            total,
        ] = await this.entityManager.findAndCount(
            CourseReviewEntity,
            {
                order: {
                    // newest first: a review written after ten modules says more about the course
                    // than the one written after the first lesson, and recency is the only signal
                    // this list has for that
                    createdAt: "DESC",
                },
                skip,
                take,
                where: {
                    courseId,
                },
            },
        )

        const {
            averageScore,
        } = await this.courseReviewStatsProjectionService.getStats(courseId)

        return {
            averageScore,
            nodes,
            total,
        }
    }
}
