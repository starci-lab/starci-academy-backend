import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserChallengeSubmissionFeedbacksRequest,
} from "./graphql-types"

export class UserChallengeSubmissionFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionFeedbacksRequest>,
    ) {}
}
