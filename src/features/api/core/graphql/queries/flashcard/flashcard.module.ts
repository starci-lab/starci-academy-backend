import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    MyInProgressFlashcardQuizSessionSingleQueryModule,
} from "./my-in-progress-flashcard-quiz-session"

/**
 * Flashcard quick-quiz ("Hỏi nhanh") resumable-session query group — a new,
 * sensibly-named sibling of `flashcard-decks` (which owns deck/card reads +
 * the Mock Interview reads that historically ended up nested there); this
 * group is reserved for flashcard-QUIZ-session reads so future additions
 * have a proper home instead of piling onto `flashcard-decks`.
 */
@Module({
    imports: [
        MyInProgressFlashcardQuizSessionSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardQueriesModule extends ConfigurableModuleClass {}
