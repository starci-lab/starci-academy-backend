import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"
import {
    SuggestionsPayload,
} from "@modules/api/apollo/server/graphql-types/object-types/suggestions"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ConsultantSuggestionsQuery,
} from "./consultant-suggestions.query"

@Injectable()
/**
 * Thin façade dispatching consultant suggest requests onto the CQRS query bus.
 */
export class ConsultantSuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatch a fully-built params object onto the query bus.
     *
     * @param params - Locale + suggest request payload.
     * @returns The autocomplete suggestions payload.
     */
    async execute(
        params: ExecuteParams<SuggestionsRequest>,
    ): Promise<SuggestionsPayload> {
        // hand the params to the registered ConsultantSuggestionsHandler
        return this.queryBus.execute(
            new ConsultantSuggestionsQuery(params),
        )
    }

    /**
     * Convenience wrapper used by the resolver -- assembles params from the
     * resolved locale + the incoming request and delegates to {@link execute}.
     *
     * @param locale - Locale resolved from the request context.
     * @param request - The typed prefix + optional limit.
     * @returns The autocomplete suggestions payload.
     */
    async query(
        locale: Locale,
        request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // adapt the (locale, request) pair into the shared ExecuteParams shape
        return this.execute({
            request,
            locale,
        })
    }
}
