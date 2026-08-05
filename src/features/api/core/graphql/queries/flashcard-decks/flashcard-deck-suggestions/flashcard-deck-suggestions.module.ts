import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-deck-suggestions.module-definition"
import {
    FlashcardDeckSuggestionsHandler,
} from "./flashcard-deck-suggestions.handler"
import {
    FlashcardDeckSuggestionsResolver,
} from "./flashcard-deck-suggestions.resolver"
import {
    FlashcardDeckSuggestionsService,
} from "./flashcard-deck-suggestions.service"

@Module({
    providers: [
        FlashcardDeckSuggestionsService,
        FlashcardDeckSuggestionsResolver,
        FlashcardDeckSuggestionsHandler,
    ],
})
/** Feature-module boundary for the `flashcardDeckSuggestions` query — wires its resolver + service + CQRS handler. */
export class FlashcardDeckSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
