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
import {
    MyDueFlashcardsSingleQueryModule,
} from "./my-due-flashcards"
import {
    MyFlashcardStatsSingleQueryModule,
} from "./my-flashcard-stats"
import {
    MyInterviewHistorySingleQueryModule,
} from "./my-interview-history"
import {
    InterviewSessionsSingleQueryModule,
} from "./interview-sessions"
import {
    InterviewSessionAttemptsSingleQueryModule,
} from "./interview-session-attempts"

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
        MyDueFlashcardsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInterviewHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        InterviewSessionsSingleQueryModule.register({
            isGlobal: true,
        }),
        InterviewSessionAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardDecksQueriesModule extends ConfigurableModuleClass {}
