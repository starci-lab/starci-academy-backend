import {
    AbstractSuggestionsHandler,
} from "@modules/elasticsearch"
import {
    ConsultantEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ConsultantSuggestionsQuery,
} from "./consultant-suggestions.query"

@QueryHandler(ConsultantSuggestionsQuery)
@Injectable()
/**
 * Consultant autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * only declares the entity it serves. The base resolves the per-locale
 * `consultants-*` index and runs the FST-backed `suggest` completion field
 * (populated by the sync builder with the consultant name + a popularity
 * weight), so prefixes like "ng" return "Nguyen ..." instantly, ranked by
 * weight, with built-in fuzzy typo tolerance. The injected
 * `ElasticsearchService` constructor is inherited — no redeclaration needed.
 */
export class ConsultantSuggestionsHandler
    extends AbstractSuggestionsHandler<ConsultantSuggestionsQuery> {
    /** The consultant index this handler autocompletes against. */
    protected readonly entityName = ConsultantEntity.name
}
