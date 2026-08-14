import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseReviewsRequest,
} from "./graphql-types/request"

/** CQRS message that loads one page of a course's reviews with its aggregate. */
export class CourseReviewsQuery {
    constructor(
        readonly params: ExecuteParams<CourseReviewsRequest>,
    ) {}
}
