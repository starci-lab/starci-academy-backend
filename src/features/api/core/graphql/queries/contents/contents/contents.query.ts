import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentsRequest,
} from "./graphql-types"

export class ContentsQuery {
    constructor(
        readonly params: ExecuteParams<ContentsRequest>,
    ) {}
}
