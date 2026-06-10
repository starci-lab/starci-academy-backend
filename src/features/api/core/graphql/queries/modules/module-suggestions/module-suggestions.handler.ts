import {
    ModuleEntity,
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
    ModuleSuggestionsQuery,
} from "./module-suggestions.query"

/**
 * Module autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it only
 * declares the entity name (`ModuleEntity`) so the base resolves the per-locale
 * `modules-*` index and runs the FST-backed completion suggester (ranked by weight,
 * de-duplicated, fuzzy/typo-tolerant). Prefixes like "dat" return "Database..."
 * instantly. The base maps options to clean `{ id, label }` items, so the result
 * flows straight into the shared `SuggestionsPayload` with no extra mapping.
 */
@QueryHandler(ModuleSuggestionsQuery)
@Injectable()
export class ModuleSuggestionsHandler
    extends AbstractSuggestionsHandler<ModuleSuggestionsQuery> {
    // index resolution targets the module index (drives `indicateName`)
    protected readonly entityName = ModuleEntity.name
}
