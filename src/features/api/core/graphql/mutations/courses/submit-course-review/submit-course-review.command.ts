import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SubmitCourseReviewRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the submitCourseReview mutation. */
export class SubmitCourseReviewCommand {
    constructor(
        readonly params: ExecuteParams<SubmitCourseReviewRequest>,
    ) {}
}
