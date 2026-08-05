import {
    MilestoneEntity,
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
    MilestoneSuggestionsQuery,
} from "./milestone-suggestions.query"

@QueryHandler(MilestoneSuggestionsQuery)
@Injectable()
/**
 * Milestone autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale `milestones`
 * index, runs the FST-backed `suggest` completion field (populated by the ES sync
 * builder with the clean milestone title + a popularity weight) and maps options to
 * clean `{ id, label }` items. So prefixes like "auth" return "Authentication"
 * instantly, ranked by weight, with built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
export class MilestoneSuggestionsHandler
    extends AbstractSuggestionsHandler<MilestoneSuggestionsQuery> {
    /** Entity this handler autocompletes — drives `milestones` index resolution. */
    protected readonly entityName = MilestoneEntity.name
}
