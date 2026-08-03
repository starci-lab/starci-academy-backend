import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    Locale,
} from "@modules/databases"
import {
    SuggestionsPayload,
    SuggestionsRequest,
} from "@modules/api"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    HeadhuntingCompanySuggestionsQuery,
} from "./headhunting-company-suggestions.query"

/**
 * Thin façade dispatching headhunting company suggest requests onto the CQRS
 * query bus.
 */
@Injectable()
export class HeadhuntingCompanySuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<SuggestionsRequest>,
    ): Promise<SuggestionsPayload> {
        // dispatch through the CQRS bus so the shared suggestions handler runs it
        return this.queryBus.execute(
            new HeadhuntingCompanySuggestionsQuery(params),
        )
    }

    async query(
        locale: Locale,
        request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // adapt the resolver args into the standard execute params envelope
        return this.execute({
            request,
            locale,
        })
    }
}
