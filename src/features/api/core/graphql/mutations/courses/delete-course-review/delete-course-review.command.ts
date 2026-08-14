import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    DeleteCourseReviewRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the deleteCourseReview mutation. */
export class DeleteCourseReviewCommand {
    constructor(
        readonly params: ExecuteParams<DeleteCourseReviewRequest>,
    ) {}
}
