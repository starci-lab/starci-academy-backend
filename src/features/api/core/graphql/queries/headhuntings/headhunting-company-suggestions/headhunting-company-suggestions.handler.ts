import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
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
    HeadhuntingCompanySuggestionsQuery,
} from "./headhunting-company-suggestions.query"

@QueryHandler(HeadhuntingCompanySuggestionsQuery)
@Injectable()
/**
 * Headhunting company autocomplete (typeahead) handler.
 *
 * Inherits the entire ES Completion Suggester flow from
 * {@link AbstractSuggestionsHandler}; it only declares the entity it serves so the
 * base resolves the per-locale `headhunting-companies-*` index and queries its
 * FST-backed `suggest` field (ranked by weight, de-duplicated, fuzzy/typo-tolerant).
 */
export class HeadhuntingCompanySuggestionsHandler
    extends AbstractSuggestionsHandler<HeadhuntingCompanySuggestionsQuery> {
    /** Drives index resolution to the headhunting-companies indices. */
    protected readonly entityName = HeadhuntingCompanyEntity.name
}
