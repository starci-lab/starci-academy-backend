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
    FoundationCategorySuggestionsService,
} from "./foundation-category-suggestions.service"
import {
    FoundationCategorySuggestionsRequest,
} from "./graphql-types/request"
import {
    FoundationCategorySuggestionsPayload,
    FoundationCategorySuggestionsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public GraphQL entry for `foundationCategorySuggestions` -- typeahead over
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
