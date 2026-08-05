import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserPersonalTaskAttemptsRequest,
} from "./graphql-types"

/**
 * CQRS message carrying userPersonalTaskAttempts ExecuteParams into the handler.
 */
export class UserPersonalTaskAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptsRequest>,
    ) {}
}
