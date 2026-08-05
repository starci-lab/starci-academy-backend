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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    SuggestionsRequest,
} from "@modules/api/apollo/server/graphql-types/inputs/suggestions"
import {
    SuggestionsPayload,
    SuggestionsResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/suggestions"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
        // delegate to the service -> CQRS bus -> ES completion suggester
        return this.contentSuggestionsService.query(locale,
            request)
    }
}
