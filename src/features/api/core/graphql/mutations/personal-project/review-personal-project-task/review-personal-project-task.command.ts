import {
    ExecuteParams,
} from "../../../../types"
import {
    ReviewPersonalProjectTaskRequest,
} from "./graphql-types"

export class ReviewPersonalProjectTaskCommand {
    constructor(
        readonly params: ExecuteParams<ReviewPersonalProjectTaskRequest>,
    ) { }
}
