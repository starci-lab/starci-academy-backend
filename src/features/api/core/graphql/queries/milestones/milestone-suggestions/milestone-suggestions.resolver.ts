import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    SuggestionsPayload,
    SuggestionsRequest,
    SuggestionsResponse,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    MilestoneSuggestionsService,
} from "./milestone-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `milestoneSuggestions` autocomplete (typeahead) query.
 */
export class MilestoneSuggestionsResolver {
    constructor(
        private readonly milestoneSuggestionsService: MilestoneSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for milestones (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching milestone suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý cột mốc thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Milestone suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "milestoneSuggestions",
            description: "Autocomplete suggestions for milestones (typeahead).",
        },
    )
    async milestoneSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service -> CQRS query bus -> MilestoneSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.milestoneSuggestionsService.query(locale,
            request)
    }
}
