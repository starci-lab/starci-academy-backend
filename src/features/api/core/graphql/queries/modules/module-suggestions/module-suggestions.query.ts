import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"

/**
 * Module autocomplete (typeahead) suggestions query.
 *
 * Carries the shared `{ locale, request: { query, limit } }` params shape, which
 * satisfies the `SuggestionsQuery` contract consumed by `AbstractSuggestionsHandler`.
 */
export class ModuleSuggestionsQuery {
    constructor(
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
