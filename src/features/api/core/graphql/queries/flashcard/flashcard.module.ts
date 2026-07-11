import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    MyInProgressFlashcardQuizSessionSingleQueryModule,
} from "./my-in-progress-flashcard-quiz-session"
import {
    MyFlashcardQuizHistorySingleQueryModule,
} from "./my-flashcard-quiz-history"
import {
    MyFlashcardQuizStatsSingleQueryModule,
} from "./my-flashcard-quiz-stats"
import {
    MyInProgressFlashcardReviewSessionSingleQueryModule,
} from "./my-in-progress-flashcard-review-session"
import {
    MyFlashcardReviewHistorySingleQueryModule,
} from "./my-flashcard-review-history"
import {
    MyFlashcardReviewStatsSingleQueryModule,
} from "./my-flashcard-review-stats"
import {
    MyInProgressFlashcardDueReviewSessionSingleQueryModule,
} from "./my-in-progress-flashcard-due-review-session"
import {
    MyFlashcardReviewSessionBySessionIdSingleQueryModule,
} from "./my-flashcard-review-session-by-session-id"
import {
    MyFlashcardReviewSessionStatsBySessionIdSingleQueryModule,
} from "./my-flashcard-review-session-stats-by-session-id"
import {
    MyFlashcardQuizSessionBySessionIdSingleQueryModule,
} from "./my-flashcard-quiz-session-by-session-id"

/**
 * Flashcard quick-quiz ("Hỏi nhanh") + review ("Học thẻ") resumable-session
 * query group — a new, sensibly-named sibling of `flashcard-decks` (which
 * owns deck/card reads + the Mock Interview reads that historically ended up
 * nested there); this group is reserved for flashcard-SESSION reads so
 * future additions have a proper home instead of piling onto
 * `flashcard-decks`.
 */
@Module({
    imports: [
        MyInProgressFlashcardQuizSessionSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardQuizHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardQuizStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInProgressFlashcardReviewSessionSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardReviewHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardReviewStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInProgressFlashcardDueReviewSessionSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardReviewSessionBySessionIdSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardReviewSessionStatsBySessionIdSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFlashcardQuizSessionBySessionIdSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardQueriesModule extends ConfigurableModuleClass {}
