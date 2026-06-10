import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"

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
