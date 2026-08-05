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
    MilestoneTaskSuggestionsService,
} from "./milestone-task-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `milestoneTaskSuggestions` autocomplete (typeahead) query.
 */
export class MilestoneTaskSuggestionsResolver {
    constructor(
        private readonly milestoneTaskSuggestionsService: MilestoneTaskSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for milestone tasks (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching milestone task suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý nhiệm vụ thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Milestone task suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "milestoneTaskSuggestions",
            description: "Autocomplete suggestions for milestone tasks (typeahead).",
        },
    )
    async milestoneTaskSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service -> CQRS query bus -> MilestoneTaskSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.milestoneTaskSuggestionsService.query(locale,
            request)
    }
}
