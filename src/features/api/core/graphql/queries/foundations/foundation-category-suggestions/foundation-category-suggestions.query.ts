import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationCategorySuggestionsRequest,
} from "./graphql-types/request"

/**
 * Foundation category autocomplete suggestions query.
 */
export class FoundationCategorySuggestionsQuery {
    constructor(
        readonly params: ExecuteParams<FoundationCategorySuggestionsRequest>,
    ) {}
}
