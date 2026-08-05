import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ReviewPersonalProjectTaskRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for per-task review enqueue -- branch validation and job
 * dispatch stay in the handler, not the GraphQL leaf.
 */
export class ReviewPersonalProjectTaskCommand {
    constructor(
        readonly params: ExecuteParams<ReviewPersonalProjectTaskRequest>,
    ) { }
}
