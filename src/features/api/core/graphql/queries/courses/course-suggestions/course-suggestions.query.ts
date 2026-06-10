import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"

/**
 * Course autocomplete (typeahead) suggestions query.
 *
 * Carries the locale + prefix/limit request through the CQRS bus to the
 * {@link CourseSuggestionsHandler}; `ExecuteParams<SuggestionsRequest>` already
 * satisfies the shared `SuggestionsQuery` contract consumed by the abstract
 * suggestions handler.
 */
export class CourseSuggestionsQuery {
    constructor(
        /** Locale + request (prefix + optional limit) for the suggest query. */
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
