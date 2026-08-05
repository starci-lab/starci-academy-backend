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
    ExecuteParams,
} from "@features/api/core/types"
import {
    SuggestionsRequest,
} from "@modules/api"
import {
    SuggestionsPayloadShape,
} from "@modules/elasticsearch"
import {
    MilestoneTaskSuggestionsQuery,
} from "./milestone-task-suggestions.query"

@Injectable()
/**
 * Thin application service bridging the resolver and the CQRS query bus for the
 * milestone task autocomplete (typeahead) query.
 */
export class MilestoneTaskSuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatch the suggestions query on the CQRS bus.
     *
     * @param params - locale + request (prefix + optional limit)
     * @returns the `{ data }` payload of clean `{ id, label }` suggestions
     */
    async execute(
        params: ExecuteParams<SuggestionsRequest>,
    ): Promise<SuggestionsPayloadShape> {
        // hand off to the registered MilestoneTaskSuggestionsHandler via the query bus
        return this.queryBus.execute(
            new MilestoneTaskSuggestionsQuery(params),
        )
    }

    /**
     * Resolver-facing helper that packs the locale + request into `ExecuteParams`.
     *
     * @param locale - locale used to resolve the per-locale ES index
     * @param request - prefix + optional limit to autocomplete against
     * @returns the `{ data }` payload of clean `{ id, label }` suggestions
     */
    async query(
        locale: Locale,
        request: SuggestionsRequest,
    ): Promise<SuggestionsPayloadShape> {
        // normalize into the shared ExecuteParams envelope the query expects
        return this.execute({
            request,
            locale,
        })
    }
}
