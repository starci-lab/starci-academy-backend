import {
    ChallengeEntity,
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
    ChallengeSuggestionsQuery,
} from "./challenge-suggestions.query"

/**
 * Challenge autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale `challenges`
 * index, runs the FST-backed `suggest` completion field (populated by the ES sync
 * builder with the clean challenge title + a popularity weight) and maps options to
 * clean `{ id, label }` items. So prefixes like "rate" return "Distributed Rate Limiter"
 * instantly, ranked by weight, with built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
@QueryHandler(ChallengeSuggestionsQuery)
@Injectable()
export class ChallengeSuggestionsHandler
    extends AbstractSuggestionsHandler<ChallengeSuggestionsQuery> {
    /** Entity this handler autocompletes — drives `challenges` index resolution. */
    protected readonly entityName = ChallengeEntity.name
}
