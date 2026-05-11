import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserPersonalTaskAttemptsRequest,
} from "./graphql-types"

export class UserPersonalTaskAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptsRequest>,
    ) {}
}
