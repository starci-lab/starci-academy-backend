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
    FlashcardDeckSuggestionsService,
} from "./flashcard-deck-suggestions.service"

@Resolver()
/**
 * GraphQL resolver exposing the `flashcardDeckSuggestions` autocomplete (typeahead) query.
 */
export class FlashcardDeckSuggestionsResolver {
    constructor(
        private readonly flashcardDeckSuggestionsService: FlashcardDeckSuggestionsService,
    ) {}

    /**
     * Autocomplete suggestions for flashcard decks (typeahead).
     *
     * @param locale - active locale (resolves the per-locale ES index)
     * @param request - typed prefix + optional limit to autocomplete against
     * @returns the matching deck suggestions, best (weighted) match first
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy gợi ý bộ thẻ ghi nhớ thành công",
        [Locale.En]: "Flashcard deck suggestions fetched successfully",
    })
    @Query(
        () => SuggestionsResponse,
        {
            name: "flashcardDeckSuggestions",
            description: "Autocomplete suggestions for flashcard decks (typeahead).",
        },
    )
    async flashcardDeckSuggestions(
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: SuggestionsRequest,
    ): Promise<SuggestionsPayload> {
        // delegate to the service → CQRS query bus → FlashcardDeckSuggestionsHandler;
        // the handler's SuggestionsPayloadShape is structurally the SuggestionsPayload
        return this.flashcardDeckSuggestionsService.query(locale,
            request)
    }
}
