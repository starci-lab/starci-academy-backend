import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

/**
 * Milestone task autocomplete (typeahead) suggestions query.
 *
 * Carries the locale + prefix/limit request through the CQRS bus to the
 * {@link MilestoneTaskSuggestionsHandler}; `ExecuteParams<SuggestionsRequest>`
 * already satisfies the shared `SuggestionsQuery` contract consumed by the
 * abstract suggestions handler.
 */
export class MilestoneTaskSuggestionsQuery {
    constructor(
        /** Locale + request (prefix + optional limit) for the suggest query. */
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
