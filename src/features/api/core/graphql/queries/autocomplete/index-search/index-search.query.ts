import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    IndexSearchRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for `indexSearch`. Carries the typed request + locale across
 * the bus so the resolver never imports Elasticsearch.
 */
export class IndexSearchQuery {
    constructor(
        readonly params: ExecuteParams<IndexSearchRequest>,
    ) {}
}
