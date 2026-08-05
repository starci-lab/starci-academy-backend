import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

/**
 * Consultant autocomplete (typeahead) suggestions query.
 *
 * Carries the shared `{ locale, request: { query, limit } }` params consumed by
 * {@link AbstractSuggestionsHandler}; `ExecuteParams<SuggestionsRequest>`
 * structurally satisfies the abstract handler's `SuggestionsQuery` contract.
 */
export class ConsultantSuggestionsQuery {
    constructor(
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
