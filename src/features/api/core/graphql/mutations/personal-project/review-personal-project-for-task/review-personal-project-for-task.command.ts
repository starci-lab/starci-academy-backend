import {
    ExecuteParams,
} from "../../../../types"
import {
    ReviewPersonalProjectForTaskRequest,
} from "./graphql-types"

export class ReviewPersonalProjectForTaskCommand {
    constructor(
        readonly params: ExecuteParams<ReviewPersonalProjectForTaskRequest>,
    ) { }
}
