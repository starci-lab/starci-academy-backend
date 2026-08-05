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
    HeadhuntingCompanySuggestionsService,
} from "./headhunting-company-suggestions.service"

@Resolver()
/**
 * Resolver for the headhunting company autocomplete (typeahead) query.
 */
export class HeadhuntingCompanySuggestionsResolver {
    constructor(
        private readonly headhuntingCompanySuggestionsService: HeadhuntingCompanySuggestionsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý công ty headhunter thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Headhunting company suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "headhuntingCompanySuggestions",
            description: "Autocomplete suggestions for headhunting companies (typeahead).",
        },
    )
    async headhuntingCompanySuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service, which dispatches the shared suggestions handler
        return this.headhuntingCompanySuggestionsService.query(locale,
            request)
    }
}
