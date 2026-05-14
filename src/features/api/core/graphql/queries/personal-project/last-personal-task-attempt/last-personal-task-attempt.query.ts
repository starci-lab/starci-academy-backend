import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LastPersonalTaskAttemptRequest,
} from "./graphql-types"

export class LastPersonalTaskAttemptQuery {
    constructor(
        readonly params: ExecuteParams<LastPersonalTaskAttemptRequest>,
    ) {}
}
