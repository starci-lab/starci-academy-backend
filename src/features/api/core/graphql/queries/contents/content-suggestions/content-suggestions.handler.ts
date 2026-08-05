import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    AbstractSuggestionsHandler,
} from "@modules/integrations/elasticsearch/suggestions/abstract-suggestions.handler"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ContentSuggestionsQuery,
} from "./content-suggestions.query"

@QueryHandler(ContentSuggestionsQuery)
@Injectable()
/**
 * Content autocomplete (typeahead) handler -- ES Completion Suggester.
 *
 * Inherits the whole suggest flow from {@link AbstractSuggestionsHandler}: it reads
 * `{ locale, request }` off the query, resolves the per-locale `contents-*` index,
 * runs the FST-backed `suggest` completion field (populated by the ES sync builder
 * with the clean lesson title + an order-based weight), and maps the options to
 * clean `{ id, label }` items -- so prefixes like "rea" return "React" instantly,
 * ranked by weight, with built-in fuzzy typo tolerance. The only per-entity bit is
 * the {@link ContentSuggestionsHandler.entityName} used for index resolution.
 */
export class ContentSuggestionsHandler
    extends AbstractSuggestionsHandler<ContentSuggestionsQuery> {
    /** Drives per-locale index resolution to the `contents-*` indices. */
    protected readonly entityName = ContentEntity.name
}
