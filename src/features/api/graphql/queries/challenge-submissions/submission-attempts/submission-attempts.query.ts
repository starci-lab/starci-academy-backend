import {
    ExecuteParams,
} from "@features/api/types"
import {
    SubmissionAttemptsRequest,
} from "./graphql-types"

export class SubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<SubmissionAttemptsRequest>,
    ) {}
}
