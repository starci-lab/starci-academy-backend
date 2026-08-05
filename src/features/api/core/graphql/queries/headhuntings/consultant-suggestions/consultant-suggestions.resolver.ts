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
