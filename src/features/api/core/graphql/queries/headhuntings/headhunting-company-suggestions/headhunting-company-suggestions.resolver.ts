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
