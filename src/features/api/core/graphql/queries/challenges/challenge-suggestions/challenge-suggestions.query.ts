import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

/**
 * Challenge autocomplete (typeahead) suggestions query.
 *
 * Carries the locale + prefix/limit request through the CQRS bus to the
 * {@link ChallengeSuggestionsHandler}; `ExecuteParams<SuggestionsRequest>` already
 * satisfies the shared `SuggestionsQuery` contract consumed by the abstract
 * suggestions handler.
 */
export class ChallengeSuggestionsQuery {
    constructor(
        /** Locale + request (prefix + optional limit) for the suggest query. */
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
