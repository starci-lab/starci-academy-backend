import {
    ExecuteParams,
} from "@features/api/types"
import {
    CvReviewHistoryRequest,
} from "./graphql-types"

export class CvReviewHistoryQuery {
    constructor(
        readonly params: ExecuteParams<CvReviewHistoryRequest>,
    ) {}
}
