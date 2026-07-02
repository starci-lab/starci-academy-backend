import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CvGenerationRequest,
} from "./graphql-types"

export class CvGenerationQuery {
    constructor(
        readonly params: ExecuteParams<CvGenerationRequest>,
    ) { }
}
