import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseReviewsQuery,
} from "./course-reviews.query"
import type {
    CourseReviewsPageObject,
} from "./graphql-types/course-reviews-page.object"
import type {
    CourseReviewsRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the courseReviews request to the CQRS query bus. */
export class CourseReviewsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatches the courseReviews query and returns the page with its aggregate.
     *
     * @param params - Request/user/locale context for the query.
     * @returns A page of reviews and the course's mean score.
     */
    async execute(
        params: ExecuteParams<CourseReviewsRequest>,
    ): Promise<CourseReviewsPageObject> {
        // hand off to the query handler which owns the read and the projection lookup
        return this.queryBus.execute(
            new CourseReviewsQuery(params),
        )
    }
}
