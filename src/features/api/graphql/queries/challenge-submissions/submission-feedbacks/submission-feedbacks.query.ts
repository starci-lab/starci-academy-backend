import {
    ExecuteParams,
} from "@features/api/types"
import {
    SubmissionFeedbacksRequest,
} from "./graphql-types"

export class SubmissionFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<SubmissionFeedbacksRequest>,
    ) {}
}
