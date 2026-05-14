import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserMilestoneTaskFeedbacksRequest,
} from "./graphql-types"

export class UserMilestoneTaskFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserMilestoneTaskFeedbacksRequest>,
    ) {}
}
