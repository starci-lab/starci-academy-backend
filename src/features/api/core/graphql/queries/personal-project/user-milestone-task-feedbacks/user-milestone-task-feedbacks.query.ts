import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserMilestoneTaskFeedbacksRequest,
} from "./graphql-types"

/**
 * CQRS message carrying userMilestoneTaskFeedbacks ExecuteParams into the handler.
 */
export class UserMilestoneTaskFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserMilestoneTaskFeedbacksRequest>,
    ) {}
}
