import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
} from "./graphql-types"

/**
 * CQRS message carrying userPersonalTaskAttemptFeedbacks ExecuteParams into the handler.
 */
export class UserPersonalTaskAttemptFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptFeedbacksRequest>,
    ) {}
}
