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
    ContentSuggestionsQuery,
} from "./content-suggestions.query"

@Injectable()
/**
 * Thin service that dispatches the content suggest query onto the CQRS bus.
 *
 * Mirrors the foundations precedent: the resolver passes locale + request here,
 * this builds the query object and lets {@link ContentSuggestionsHandler} resolve it.
 */
export class ContentSuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatch a fully-built execute payload onto the query bus.
     *
     * @param params - Locale + suggest request wrapped as {@link ExecuteParams}.
     * @returns The matching suggestions payload.
     */
    async execute(
        params: ExecuteParams<SuggestionsRequest>,
    ): Promise<SuggestionsPayload> {
        // hand the query to the bus so the registered handler runs the suggester
        return this.queryBus.execute(
            new ContentSuggestionsQuery(params),
        )
    }

    /**
     * Convenience wrapper used by the resolver -- packs locale + request together.
     *
     * @param locale - Locale resolved from the request (selects the ES index).
     * @param request - The typed prefix + optional limit.
     * @returns The matching suggestions payload.
     */
    async query(
        locale: Locale,
        request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // pack locale + request into the execute envelope the bus expects
        return this.execute({
            request,
            locale,
        })
    }
}
