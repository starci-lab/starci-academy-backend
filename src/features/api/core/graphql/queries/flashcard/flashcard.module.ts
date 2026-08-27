import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    MyInProgressFlashcardQuizSessionSingleQueryModule,
} from "./my-in-progress-flashcard-quiz-session/my-in-progress-flashcard-quiz-session.module"
import {
    FlashcardQuizEligibilitySingleQueryModule,
} from "./flashcard-quiz-eligibility/flashcard-quiz-eligibility.module"
import {
    MyFlashcardQuizHistorySingleQueryModule,
} from "./my-flashcard-quiz-history/my-flashcard-quiz-history.module"
import {
    MyFlashcardQuizStatsSingleQueryModule,
} from "./my-flashcard-quiz-stats/my-flashcard-quiz-stats.module"
import {
    MyInProgressFlashcardReviewSessionSingleQueryModule,
} from "./my-in-progress-flashcard-review-session/my-in-progress-flashcard-review-session.module"
import {
    MyFlashcardReviewHistorySingleQueryModule,
} from "./my-flashcard-review-history/my-flashcard-review-history.module"
import {
    MyFlashcardReviewStatsSingleQueryModule,
} from "./my-flashcard-review-stats/my-flashcard-review-stats.module"
import {
    MyInProgressFlashcardDueReviewSessionSingleQueryModule,
} from "./my-in-progress-flashcard-due-review-session/my-in-progress-flashcard-due-review-session.module"
import {
    MyFlashcardReviewSessionBySessionIdSingleQueryModule,
} from "./my-flashcard-review-session-by-session-id/my-flashcard-review-session-by-session-id.module"
import {
    MyFlashcardReviewSessionStatsBySessionIdSingleQueryModule,
} from "./my-flashcard-review-session-stats-by-session-id/my-flashcard-review-session-stats-by-session-id.module"
import {
    MyFlashcardQuizSessionBySessionIdSingleQueryModule,
} from "./my-flashcard-quiz-session-by-session-id/my-flashcard-quiz-session-by-session-id.module"

@Module({
    imports: [
        FlashcardQuizEligibilitySingleQueryModule.register({
            isGlobal: true,
        }),
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
/**
 * Flashcard quick-quiz + review resumable-session
 * query group -- a new, sensibly-named sibling of `flashcard-decks` (which
 * owns deck/card reads + the Mock Interview reads that historically ended up
 * nested there); this group is reserved for flashcard-SESSION reads so
 * future additions have a proper home instead of piling onto
 * `flashcard-decks`.
 */
export class FlashcardQueriesModule extends ConfigurableModuleClass {}
