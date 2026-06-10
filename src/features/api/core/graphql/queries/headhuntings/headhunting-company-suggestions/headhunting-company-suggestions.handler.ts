import {
    HeadhuntingCompanyEntity,
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
    HeadhuntingCompanySuggestionsQuery,
} from "./headhunting-company-suggestions.query"

/**
 * Headhunting company autocomplete (typeahead) handler.
 *
 * Inherits the entire ES Completion Suggester flow from
 * {@link AbstractSuggestionsHandler}; it only declares the entity it serves so the
 * base resolves the per-locale `headhunting-companies-*` index and queries its
 * FST-backed `suggest` field (ranked by weight, de-duplicated, fuzzy/typo-tolerant).
 */
@QueryHandler(HeadhuntingCompanySuggestionsQuery)
@Injectable()
export class HeadhuntingCompanySuggestionsHandler
    extends AbstractSuggestionsHandler<HeadhuntingCompanySuggestionsQuery> {
    /** Drives index resolution to the headhunting-companies indices. */
    protected readonly entityName = HeadhuntingCompanyEntity.name
}
