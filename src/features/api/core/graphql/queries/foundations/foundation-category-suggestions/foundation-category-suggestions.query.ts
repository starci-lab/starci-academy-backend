import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationCategorySuggestionsRequest,
} from "./graphql-types"

/**
 * Foundation category autocomplete suggestions query.
 */
export class FoundationCategorySuggestionsQuery {
    constructor(
        readonly params: ExecuteParams<FoundationCategorySuggestionsRequest>,
    ) {}
}
