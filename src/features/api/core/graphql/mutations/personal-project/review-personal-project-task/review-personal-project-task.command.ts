import {
    ExecuteParams,
} from "../../../../types"
import {
    ReviewPersonalProjectTaskRequest,
} from "./graphql-types"

/**
 * CQRS envelope for per-task review enqueue -- branch validation and job
 * dispatch stay in the handler, not the GraphQL leaf.
 */
export class ReviewPersonalProjectTaskCommand {
    constructor(
        readonly params: ExecuteParams<ReviewPersonalProjectTaskRequest>,
    ) { }
}
