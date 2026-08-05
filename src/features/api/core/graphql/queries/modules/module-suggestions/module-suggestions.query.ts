import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

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
