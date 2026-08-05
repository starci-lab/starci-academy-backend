import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationCategoriesRequest,
} from "./graphql-types/request"

/**
 * Foundation categories list query (paginated + searchable).
 */
export class FoundationCategoriesQuery {
    constructor(
        readonly params: ExecuteParams<FoundationCategoriesRequest | undefined>,
    ) {}
}
