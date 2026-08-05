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
    FlashcardCardsByIdsSingleQueryModule,
} from "./flashcard-cards-by-ids"
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
    MyMockInterviewAttemptBySessionSingleQueryModule,
} from "./my-mock-interview-attempt-by-session"
import {
    MyInProgressMockInterviewSessionSingleQueryModule,
} from "./my-in-progress-mock-interview-session"
import {
    MyMockInterviewStatsSingleQueryModule,
} from "./my-mock-interview-stats"

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
        FlashcardCardsByIdsSingleQueryModule.register({
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
        MyMockInterviewAttemptBySessionSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInProgressMockInterviewSessionSingleQueryModule.register({
            isGlobal: true,
        }),
        MyMockInterviewStatsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Flashcard-deck query group (deck listing by course + single-deck detail +
 * typeahead + mock-interview prompt/history/resume reads).
 */
export class FlashcardDecksQueriesModule extends ConfigurableModuleClass {}
