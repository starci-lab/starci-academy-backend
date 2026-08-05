import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"

/**
 * Content autocomplete (typeahead) suggestions query.
 *
 * Carries the locale + prefix/limit request that the shared
 * `AbstractSuggestionsHandler` consumes to drive the ES Completion Suggester.
 */
export class ContentSuggestionsQuery {
    /**
     * @param params - Locale + the `{ query, limit }` suggest request payload.
     */
    constructor(
        readonly params: ExecuteParams<SuggestionsRequest>,
    ) {}
}
