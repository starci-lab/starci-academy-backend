import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserChallengeSubmissionAttemptsRequest,
} from "./graphql-types"

export class UserChallengeSubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionAttemptsRequest>,
    ) {}
}
