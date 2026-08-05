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
    ModuleSuggestionsQuery,
} from "./module-suggestions.query"

@Injectable()
/**
 * Dispatches `ModuleSuggestionsQuery` onto the CQRS bus; `query` wraps the
 * resolver's locale + request into the shared execute params.
 */
export class ModuleSuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatch the module suggestions query onto the CQRS bus.
     *
     * @param params - Locale + request payload carried to the handler.
     * @returns The autocomplete suggestions payload.
     */
    async execute(
        params: ExecuteParams<SuggestionsRequest>,
    ): Promise<SuggestionsPayload> {
        // hand off to the CQRS bus -> ModuleSuggestionsHandler resolves it
        return this.queryBus.execute(
            new ModuleSuggestionsQuery(params),
        )
    }

    /**
     * Resolver-friendly entry point: assemble the params from the resolved locale + request.
     *
     * @param locale - Locale used to resolve the per-locale ES index.
     * @param request - Prefix + optional limit for the suggester.
     * @returns The autocomplete suggestions payload.
     */
    async query(
        locale: Locale,
        request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // wrap into the shared params shape, then delegate to the bus
        return this.execute({
            request,
            locale,
        })
    }
}
