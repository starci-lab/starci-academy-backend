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
    ChallengeSuggestionsService,
} from "./challenge-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `challengeSuggestions` autocomplete (typeahead) query.
 */
export class ChallengeSuggestionsResolver {
    constructor(
        private readonly challengeSuggestionsService: ChallengeSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for challenges (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching challenge suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý thử thách thành công",
        [Locale.En]: "Challenge suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "challengeSuggestions",
            description: "Autocomplete suggestions for challenges (typeahead).",
        },
    )
    async challengeSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service → CQRS query bus → ChallengeSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.challengeSuggestionsService.query(locale,
            request)
    }
}
