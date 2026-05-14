import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserCvSubmissionAttemptsRequest,
} from "./graphql-types"

export class UserCvSubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserCvSubmissionAttemptsRequest>,
    ) {}
}
