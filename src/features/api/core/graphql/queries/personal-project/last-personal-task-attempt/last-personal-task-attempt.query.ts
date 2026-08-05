import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    LastPersonalTaskAttemptRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying lastPersonalTaskAttempt ExecuteParams into the handler.
 */
export class LastPersonalTaskAttemptQuery {
    constructor(
        readonly params: ExecuteParams<LastPersonalTaskAttemptRequest>,
    ) {}
}
