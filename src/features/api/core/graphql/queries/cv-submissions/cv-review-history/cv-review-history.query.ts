import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CvReviewHistoryRequest,
} from "./graphql-types"

export class CvReviewHistoryQuery {
    constructor(
        readonly params: ExecuteParams<CvReviewHistoryRequest>,
    ) {}
}
