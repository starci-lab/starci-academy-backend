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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    FoundationCategorySuggestionsService,
} from "./foundation-category-suggestions.service"
import {
    FoundationCategorySuggestionsPayload,
    FoundationCategorySuggestionsRequest,
    FoundationCategorySuggestionsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public GraphQL entry for `foundationCategorySuggestions` — typeahead over
 * foundation category titles.
 */
export class FoundationCategorySuggestionsResolver {
    constructor(
        private readonly foundationCategorySuggestionsService: FoundationCategorySuggestionsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý nền tảng thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Foundation category suggestions fetched successfully",
    })
    @Query(
        () => FoundationCategorySuggestionsResponse,
        {
            name: "foundationCategorySuggestions",
            description: "Autocomplete suggestions for foundation categories (typeahead).",
        },
    )
    async foundationCategorySuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: FoundationCategorySuggestionsRequest,
    ): Promise<FoundationCategorySuggestionsPayload> {
        return this.foundationCategorySuggestionsService.query(locale,
            request)
    }
}
