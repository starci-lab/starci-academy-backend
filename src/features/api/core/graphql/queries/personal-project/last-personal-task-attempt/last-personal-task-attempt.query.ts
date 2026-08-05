import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LastPersonalTaskAttemptRequest,
} from "./graphql-types"

/**
 * CQRS message carrying lastPersonalTaskAttempt ExecuteParams into the handler.
 */
export class LastPersonalTaskAttemptQuery {
    constructor(
        readonly params: ExecuteParams<LastPersonalTaskAttemptRequest>,
    ) {}
}
