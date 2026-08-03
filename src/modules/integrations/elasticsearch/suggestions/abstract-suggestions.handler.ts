import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "../elasticsearch.service"
import {
    DEFAULT_SUGGESTIONS_LIMIT,
    runCompletionSuggest,
} from "../utils"
import type {
    SuggestionsPayloadShape,
    SuggestionsQuery,
} from "./types"

/**
 * Reusable base for any entity's autocomplete (typeahead) CQRS handler.
 *
 * Encapsulates the whole ES Completion Suggester flow so a concrete handler only
 * has to declare the {@link AbstractSuggestionsHandler.entityName} it serves:
 *
 * 1. read `{ locale, request: { query, limit } }` from the query params,
 * 2. resolve the per-locale index via {@link ElasticsearchService.indicateName},
 * 3. run the FST-backed completion suggester (ranked by weight, de-duplicated,
 *    fuzzy/typo-tolerant) and map options to clean `{ id, label }` items.
 *
 * The returned `{ data }` shape is compatible with the shared `SuggestionsPayload`
 * GraphQL object type, so subclasses need no extra mapping.
 *
 * @template TQuery - The concrete query object (must expose `params` with locale + request).
 *
 * @example
 * \@QueryHandler(FoundationCategorySuggestionsQuery)
 * \@Injectable()
 * export class FoundationCategorySuggestionsHandler
 *     extends AbstractSuggestionsHandler<FoundationCategorySuggestionsQuery> {
 *     protected readonly entityName = FoundationCategoryEntity.name
 * }
 */
@Injectable()
export abstract class AbstractSuggestionsHandler<TQuery extends SuggestionsQuery>
    extends ICQRSHandler<TQuery, SuggestionsPayloadShape> {
    constructor(
        // the ES client + index-name resolver shared by every suggest handler
        protected readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    /**
     * Name of the entity this handler autocompletes (e.g. `FoundationCategoryEntity.name`).
     * Drives index resolution via {@link ElasticsearchService.indicateName}.
     */
    protected abstract readonly entityName: string

    /**
     * Resolve the locale-specific index and run the completion suggester.
     *
     * @param query - The concrete query carrying `{ locale, request }` in `params`.
     * @returns The `{ data }` payload of clean `{ id, label }` suggestions.
     */
    protected override async process(
        query: TQuery,
    ): Promise<SuggestionsPayloadShape> {
        // pull the locale + prefix/limit request off the query params
        const {
            locale,
            request,
        } = query.params

        // empty prefix → no suggestions (the dropdown only shows while typing)
        const prefix = request.query?.trim() ?? ""
        if (!prefix) {
            return {
                data: [],
            }
        }

        // resolve the per-locale index for this entity (e.g. `<indices>-<locale>`)
        const index = this.elasticsearch.indicateName({
            entity: this.entityName,
            locale,
        })

        // run the FST-backed completion suggester and map options to { id, label };
        // the util clamps the limit and applies a sensible default when omitted
        const data = await runCompletionSuggest({
            client: this.elasticsearch.client,
            index,
            prefix,
            limit: request.limit ?? DEFAULT_SUGGESTIONS_LIMIT,
        })

        // already in the SuggestionsPayload-compatible shape — no extra mapping needed
        return {
            data,
        }
    }
}
