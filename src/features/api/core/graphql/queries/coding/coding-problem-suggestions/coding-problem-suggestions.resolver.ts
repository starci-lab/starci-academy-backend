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
    CodingProblemSuggestionsService,
} from "./coding-problem-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `codingProblemSuggestions` autocomplete (typeahead) query.
 */
export class CodingProblemSuggestionsResolver {
    constructor(
        private readonly codingProblemSuggestionsService: CodingProblemSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for coding-practice problems (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching problem suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý bài luyện tập thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Coding problem suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "codingProblemSuggestions",
            description: "Autocomplete suggestions for coding-practice problems (typeahead).",
        },
    )
    async codingProblemSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service -> CQRS query bus -> CodingProblemSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.codingProblemSuggestionsService.query(locale,
            request)
    }
}
