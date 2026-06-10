import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationCategoriesRequest,
} from "./graphql-types"

/**
 * Foundation categories list query (paginated + searchable).
 */
export class FoundationCategoriesQuery {
    constructor(
        readonly params: ExecuteParams<FoundationCategoriesRequest | undefined>,
    ) {}
}
