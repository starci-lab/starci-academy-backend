import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
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
    FlashcardDeckSuggestionsQuery,
} from "./flashcard-deck-suggestions.query"

@QueryHandler(FlashcardDeckSuggestionsQuery)
@Injectable()
/**
 * Flashcard-deck autocomplete (typeahead) handler -- ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale
 * `flashcard-decks` index, runs the FST-backed `suggest` completion field
 * (populated by the ES sync builder with the clean deck title + a popularity
 * weight) and maps options to clean `{ id, label }` items, ranked by weight with
 * built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
export class FlashcardDeckSuggestionsHandler
    extends AbstractSuggestionsHandler<FlashcardDeckSuggestionsQuery> {
    /** Entity this handler autocompletes -- drives `flashcard-decks` index resolution. */
    protected readonly entityName = FlashcardDeckEntity.name
}
