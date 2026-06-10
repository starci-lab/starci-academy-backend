import {
    CodingProblemEntity,
} from "@modules/databases"
import {
    AbstractSuggestionsHandler,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CodingProblemSuggestionsQuery,
} from "./coding-problem-suggestions.query"

/**
 * Coding-problem autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale
 * `coding-problems` index, runs the FST-backed `suggest` completion field
 * (populated by the ES sync builder with the clean problem title + a popularity
 * weight) and maps options to clean `{ id, label }` items, ranked by weight with
 * built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
@QueryHandler(CodingProblemSuggestionsQuery)
@Injectable()
export class CodingProblemSuggestionsHandler
    extends AbstractSuggestionsHandler<CodingProblemSuggestionsQuery> {
    /** Entity this handler autocompletes — drives `coding-problems` index resolution. */
    protected readonly entityName = CodingProblemEntity.name
}
