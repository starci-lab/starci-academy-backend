import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
} from "./graphql-types"

export class UserPersonalTaskAttemptFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptFeedbacksRequest>,
    ) {}
}
