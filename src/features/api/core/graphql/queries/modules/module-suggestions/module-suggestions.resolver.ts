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
    ModuleSuggestionsService,
} from "./module-suggestions.service"

@Resolver()
/**
 * Public GraphQL entry for `moduleSuggestions` — ES completion-suggester
 * typeahead over module titles.
 */
export class ModuleSuggestionsResolver {
    constructor(
        private readonly moduleSuggestionsService: ModuleSuggestionsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý module thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Module suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "moduleSuggestions",
            description: "Autocomplete suggestions for modules (typeahead).",
        },
    )
    async moduleSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service → CQRS bus → ES completion suggester
        return this.moduleSuggestionsService.query(locale,
            request)
    }
}
