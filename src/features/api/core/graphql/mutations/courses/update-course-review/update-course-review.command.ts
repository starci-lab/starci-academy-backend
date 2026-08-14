import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UpdateCourseReviewRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the updateCourseReview mutation. */
export class UpdateCourseReviewCommand {
    constructor(
        readonly params: ExecuteParams<UpdateCourseReviewRequest>,
    ) {}
}
