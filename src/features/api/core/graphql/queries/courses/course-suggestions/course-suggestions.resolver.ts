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
    CourseSuggestionsService,
} from "./course-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `courseSuggestions` autocomplete (typeahead) query.
 */
export class CourseSuggestionsResolver {
    constructor(
        private readonly courseSuggestionsService: CourseSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for courses (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching course suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý khóa học thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Course suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "courseSuggestions",
            description: "Autocomplete suggestions for courses (typeahead).",
        },
    )
    async courseSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service → CQRS query bus → CourseSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.courseSuggestionsService.query(locale,
            request)
    }
}
