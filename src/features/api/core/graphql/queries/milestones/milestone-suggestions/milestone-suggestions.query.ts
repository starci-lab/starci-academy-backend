import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"

/**
 * Milestone autocomplete (typeahead) suggestions query.
 *
 * Carries the locale + prefix/limit request through the CQRS bus to the
 * {@link MilestoneSuggestionsHandler}; `ExecuteParams<SuggestionsRequest>` already
 * satisfies the shared `SuggestionsQuery` contract consumed by the abstract
 * suggestions handler.
 */
export class MilestoneSuggestionsQuery {
    constructor(
        /** Locale + request (prefix + optional limit) for the suggest query. */
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
