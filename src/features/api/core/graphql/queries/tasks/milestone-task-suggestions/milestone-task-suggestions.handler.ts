import {
    MilestoneTaskEntity,
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
    MilestoneTaskSuggestionsQuery,
} from "./milestone-task-suggestions.query"

/**
 * Milestone task autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale
 * `milestone-tasks` index, runs the FST-backed `suggest` completion field
 * (populated by the ES sync builder with the clean task title + a popularity
 * weight derived from display order) and maps options to clean `{ id, label }`
 * items. So prefixes like "set" return "Set up the product catalog" instantly,
 * ranked by weight, with built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
@QueryHandler(MilestoneTaskSuggestionsQuery)
@Injectable()
export class MilestoneTaskSuggestionsHandler
    extends AbstractSuggestionsHandler<MilestoneTaskSuggestionsQuery> {
    /** Entity this handler autocompletes — drives `milestone-tasks` index resolution. */
    protected readonly entityName = MilestoneTaskEntity.name
}
