import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying userPersonalTaskAttemptFeedbacks ExecuteParams into the handler.
 */
export class UserPersonalTaskAttemptFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptFeedbacksRequest>,
    ) {}
}
