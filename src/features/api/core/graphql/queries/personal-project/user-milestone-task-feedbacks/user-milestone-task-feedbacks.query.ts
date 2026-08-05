import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserMilestoneTaskFeedbacksRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying userMilestoneTaskFeedbacks ExecuteParams into the handler.
 */
export class UserMilestoneTaskFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserMilestoneTaskFeedbacksRequest>,
    ) {}
}
