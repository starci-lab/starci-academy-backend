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
    ConsultantSuggestionsService,
} from "./consultant-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `consultantSuggestions` typeahead query.
 */
export class ConsultantSuggestionsResolver {
    constructor(
        private readonly consultantSuggestionsService: ConsultantSuggestionsService,
    ) {}

    /**
     * Autocomplete consultants by name prefix (typeahead dropdown).
     *
     * @param locale - Locale resolved from the request context.
     * @param request - The typed prefix + optional limit.
     * @returns The matching consultant suggestions, best match first.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý chuyên viên tư vấn thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Consultant suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "consultantSuggestions",
            description: "Autocomplete suggestions for consultants (typeahead).",
        },
    )
    async consultantSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service, which dispatches the CQRS suggest query
        return this.consultantSuggestionsService.query(locale,
            request)
    }
}
