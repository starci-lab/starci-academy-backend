import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-decks.module-definition"
import {
    FlashcardDecksByCourseSingleQueryModule,
} from "./flashcard-decks-by-course"
import {
    FlashcardDeckSingleQueryModule,
} from "./flashcard-deck"
import {
    FlashcardDeckSuggestionsSingleQueryModule,
} from "./flashcard-deck-suggestions"
import {
    DrawInterviewCardSingleQueryModule,
} from "./draw-interview-card"

/**
 * Flashcard-deck query group (deck listing by course + single-deck detail +
 * typeahead + random interview-question draw).
 */
@Module({
    imports: [
        FlashcardDecksByCourseSingleQueryModule.register({
            isGlobal: true,
        }),
        FlashcardDeckSingleQueryModule.register({
            isGlobal: true,
        }),
        FlashcardDeckSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        DrawInterviewCardSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardDecksQueriesModule extends ConfigurableModuleClass {}
