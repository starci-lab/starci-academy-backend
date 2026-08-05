import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserPersonalTaskAttemptsRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying userPersonalTaskAttempts ExecuteParams into the handler.
 */
export class UserPersonalTaskAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserPersonalTaskAttemptsRequest>,
    ) {}
}
