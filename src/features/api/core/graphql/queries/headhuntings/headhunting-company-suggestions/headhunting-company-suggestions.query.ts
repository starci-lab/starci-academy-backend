import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

/**
 * Headhunting company autocomplete (typeahead) suggestions query.
 *
 * Carries the shared `{ query, limit }` request plus locale in `params`, which is
 * exactly the `SuggestionsQuery` shape consumed by `AbstractSuggestionsHandler`.
 */
export class HeadhuntingCompanySuggestionsQuery {
    constructor(
        // locale + the shared prefix/limit request payload
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
