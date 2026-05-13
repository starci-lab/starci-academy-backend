import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CvReviewHistoryRequest,
} from "./graphql-types"

export class UserCvSubmissionAttemptsHistoryQuery {
    constructor(
        readonly params: ExecuteParams<CvReviewHistoryRequest>,
    ) {}
}
