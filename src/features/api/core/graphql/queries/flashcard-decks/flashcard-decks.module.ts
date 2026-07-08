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
    MyDueFlashcardsSingleQueryModule,
} from "./my-due-flashcards"
import {
    MyFlashcardStatsSingleQueryModule,
} from "./my-flashcard-stats"
import {
    MockInterviewPromptsSingleQueryModule,
} from "./mock-interview-prompts"
import {
    MyMockInterviewAttemptsSingleQueryModule,
} from "./my-mock-interview-attempts"
import {
    MyInProgressMockInterviewSessionSingleQueryModule,
} from "./my-in-progress-mock-interview-session"

/**
 * Flashcard-deck query group (deck listing by course + single-deck detail +
 * typeahead + mock-interview prompt/history/resume reads).
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
        MyDueFlashcardsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        MockInterviewPromptsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyMockInterviewAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInProgressMockInterviewSessionSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardDecksQueriesModule extends ConfigurableModuleClass {}
