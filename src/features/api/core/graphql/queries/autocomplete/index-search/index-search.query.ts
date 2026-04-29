import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    IndexSearchRequest,
} from "./graphql-types"

export class IndexSearchQuery {
    constructor(
        readonly params: ExecuteParams<IndexSearchRequest>,
    ) {}
}
