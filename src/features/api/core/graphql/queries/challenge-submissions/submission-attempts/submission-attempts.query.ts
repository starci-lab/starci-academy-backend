import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SubmissionAttemptsRequest,
} from "./graphql-types"

export class SubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<SubmissionAttemptsRequest>,
    ) {}
}
