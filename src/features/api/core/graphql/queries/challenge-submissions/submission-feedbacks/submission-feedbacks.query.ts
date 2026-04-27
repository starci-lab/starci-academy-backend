import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SubmissionFeedbacksRequest,
} from "./graphql-types"

export class SubmissionFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<SubmissionFeedbacksRequest>,
    ) {}
}
