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
    ContentSuggestionsService,
} from "./content-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `contentSuggestions` typeahead query.
 */
export class ContentSuggestionsResolver {
    constructor(
        private readonly contentSuggestionsService: ContentSuggestionsService,
    ) {}

    /**
     * Autocomplete content (lesson) titles for a typed prefix.
     *
     * @param locale - Locale resolved from the request (selects the ES index).
     * @param request - The typed prefix + optional limit.
     * @returns The matching suggestions payload (wrapped by the transform interceptor).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý nội dung thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Content suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "contentSuggestions",
            description: "Autocomplete suggestions for contents/lessons (typeahead).",
        },
    )
    async contentSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service → CQRS bus → ES completion suggester
        return this.contentSuggestionsService.query(locale,
            request)
    }
}
