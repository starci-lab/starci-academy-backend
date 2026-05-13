import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CvUrlRequest,
} from "./graphql-types"

export class CvUrlQuery {
    constructor(
        readonly params: ExecuteParams<CvUrlRequest>,
    ) {}
}
