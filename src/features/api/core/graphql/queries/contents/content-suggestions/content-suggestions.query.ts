import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"

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
