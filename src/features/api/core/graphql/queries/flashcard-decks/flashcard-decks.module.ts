import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-decks.module-definition"
import {
    FlashcardDecksByCourseSingleQueryModule,
} from "./flashcard-decks-by-course/flashcard-decks-by-course.module"
import {
    FlashcardDeckSingleQueryModule,
} from "./flashcard-deck/flashcard-deck.module"
import {
    FlashcardDeckSuggestionsSingleQueryModule,
} from "./flashcard-deck-suggestions/flashcard-deck-suggestions.module"
import {
    MyDueFlashcardsSingleQueryModule,
} from "./my-due-flashcards/my-due-flashcards.module"
import {
    FlashcardCardsByIdsSingleQueryModule,
} from "./flashcard-cards-by-ids/flashcard-cards-by-ids.module"
import {
    MyFlashcardStatsSingleQueryModule,
} from "./my-flashcard-stats/my-flashcard-stats.module"
import {
    MockInterviewPromptsSingleQueryModule,
} from "./mock-interview-prompts/mock-interview-prompts.module"
import {
    MyMockInterviewAttemptsSingleQueryModule,
} from "./my-mock-interview-attempts/my-mock-interview-attempts.module"
import {
    MyMockInterviewAttemptBySessionSingleQueryModule,
} from "./my-mock-interview-attempt-by-session/my-mock-interview-attempt-by-session.module"
import {
    MyInProgressMockInterviewSessionSingleQueryModule,
} from "./my-in-progress-mock-interview-session/my-in-progress-mock-interview-session.module"
import {
    MyMockInterviewStatsSingleQueryModule,
} from "./my-mock-interview-stats/my-mock-interview-stats.module"

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
