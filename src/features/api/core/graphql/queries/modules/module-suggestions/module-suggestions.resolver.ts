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
    ModuleSuggestionsService,
} from "./module-suggestions.service"

@Resolver()
/**
 * Public GraphQL entry for `moduleSuggestions` -- ES completion-suggester
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
        // delegate to the service -> CQRS bus -> ES completion suggester
        return this.moduleSuggestionsService.query(locale,
            request)
    }
}
