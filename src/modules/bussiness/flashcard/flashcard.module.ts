import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"
import {
    FlashcardQuizSessionService,
} from "./flashcard-quiz-session.service"
import {
    ClozeParserService,
} from "./cloze/cloze-parser.service"
import {
    FlashcardReviewService,
} from "./flashcard-review.service"
import {
    FlashcardReviewSessionService,
} from "./flashcard-review-session.service"
import {
    FlashcardDueReviewSessionService,
} from "./flashcard-due-review-session.service"

@Module({
    providers: [
        FlashcardDeckReadService,
        FlashcardQuizSessionService,
        ClozeParserService,
        FlashcardReviewService,
        FlashcardReviewSessionService,
        FlashcardDueReviewSessionService,
    ],
    exports: [
        FlashcardDeckReadService,
        FlashcardQuizSessionService,
        ClozeParserService,
        FlashcardReviewService,
        FlashcardReviewSessionService,
        FlashcardDueReviewSessionService,
    ],
})
/**
 * Module for flashcard business logic (deck reads + spaced-repetition review).
 * `AiInvokeService` / `AiEntitlementService` come from the globally-registered
 * `AiModule`, so no explicit AI import is needed here -- the unified credit pool
 * (gate + charge + history) is metered entirely through `AiEntitlementService`.
 */
export class FlashcardModule extends ConfigurableModuleClass {
}
